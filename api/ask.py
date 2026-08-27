import json
import os
import time
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler

from openai import OpenAI


# =========================================================
# CONFIG
# =========================================================

MAX_REQUEST_SIZE = 8 * 1024 * 1024  # 8 MB
MAX_QUESTION_LENGTH = 12000

# Simple per-instance rate limit.
# 10 requests per 60 seconds per client.
RATE_LIMIT = 10
RATE_WINDOW = 60

request_log = defaultdict(deque)


# =========================================================
# RATE LIMITING
# =========================================================

def get_client_key(handler):
    """
    Uses the authenticated user ID when available.
    Falls back to the connecting IP.
    """
    user_id = getattr(handler, "user_id", None)

    if user_id:
        return f"user:{user_id}"

    forwarded_for = handler.headers.get("X-Forwarded-For")

    if forwarded_for:
        return f"ip:{forwarded_for.split(',')[0].strip()}"

    return f"ip:{handler.client_address[0]}"


def check_rate_limit(key):
    now = time.time()
    requests = request_log[key]

    while requests and now - requests[0] > RATE_WINDOW:
        requests.popleft()

    if len(requests) >= RATE_LIMIT:
        retry_after = max(
            1,
            int(RATE_WINDOW - (now - requests[0]))
        )

        return False, retry_after

    requests.append(now)

    return True, None


# =========================================================
# HANDLER
# =========================================================

class handler(BaseHTTPRequestHandler):

    # -----------------------------------------------------
    # POST
    # -----------------------------------------------------

    def do_POST(self):
        try:
            # ---------------------------------------------
            # CORS / ORIGIN
            # ---------------------------------------------

            origin = self.headers.get("Origin", "")

            allowed_origin = os.environ.get(
                "ALLOWED_ORIGIN",
                "*"
            )

            if (
                allowed_origin != "*"
                and origin
                and origin != allowed_origin
            ):
                self.send_json(
                    {"error": "Origin not allowed."},
                    403
                )
                return

            # ---------------------------------------------
            # AUTHENTICATION
            # ---------------------------------------------

            authorization = self.headers.get(
                "Authorization",
                ""
            )

            if not authorization.startswith("Bearer "):
                self.send_json(
                    {
                        "error": (
                            "Authentication required. "
                            "Please sign in."
                        )
                    },
                    401
                )
                return

            access_token = authorization[7:].strip()

            if not access_token:
                self.send_json(
                    {
                        "error": (
                            "Invalid authentication token."
                        )
                    },
                    401
                )
                return

            user_id = self.verify_user(access_token)

            if not user_id:
                self.send_json(
                    {
                        "error": (
                            "Your session is invalid or expired. "
                            "Please sign in again."
                        )
                    },
                    401
                )
                return

            self.user_id = user_id

            # ---------------------------------------------
            # RATE LIMIT
            # ---------------------------------------------

            rate_key = get_client_key(self)

            allowed, retry_after = check_rate_limit(
                rate_key
            )

            if not allowed:
                self.send_response(429)

                self.send_header(
                    "Content-Type",
                    "application/json"
                )

                self.send_header(
                    "Retry-After",
                    str(retry_after)
                )

                self.send_cors_headers()

                self.end_headers()

                response = json.dumps(
                    {
                        "error": (
                            "Too many requests. "
                            "Please wait a moment and try again."
                        )
                    }
                ).encode("utf-8")

                self.wfile.write(response)

                return

            # ---------------------------------------------
            # CONTENT LENGTH
            # ---------------------------------------------

            content_length = int(
                self.headers.get(
                    "Content-Length",
                    "0"
                )
            )

            if content_length <= 0:
                self.send_json(
                    {
                        "error": "Empty request."
                    },
                    400
                )
                return

            if content_length > MAX_REQUEST_SIZE:
                self.send_json(
                    {
                        "error": (
                            "Request is too large. "
                            "Please use a smaller image."
                        )
                    },
                    413
                )
                return

            # ---------------------------------------------
            # READ BODY
            # ---------------------------------------------

            body = self.rfile.read(content_length)

            if not body:
                self.send_json(
                    {
                        "error": "Empty request."
                    },
                    400
                )
                return

            # ---------------------------------------------
            # PARSE JSON
            # ---------------------------------------------

            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self.send_json(
                    {
                        "error": "Invalid request data."
                    },
                    400
                )
                return

            if not isinstance(data, dict):
                self.send_json(
                    {
                        "error": "Invalid request format."
                    },
                    400
                )
                return

            # ---------------------------------------------
            # QUESTION
            # ---------------------------------------------

            question = str(
                data.get("question", "")
            ).strip()

            if len(question) > MAX_QUESTION_LENGTH:
                self.send_json(
                    {
                        "error": (
                            "Message is too long. "
                            "Please shorten your message."
                        )
                    },
                    413
                )
                return

            # ---------------------------------------------
            # IMAGE
            # ---------------------------------------------

            image = data.get("image")

            if image is not None:
                if not isinstance(image, str):
                    self.send_json(
                        {
                            "error": "Invalid image data."
                        },
                        400
                    )
                    return

                if not image.startswith("data:image/"):
                    self.send_json(
                        {
                            "error": "Invalid image format."
                        },
                        400
                    )
                    return

                # Prevent unexpectedly huge image payloads.
                if len(image) > MAX_REQUEST_SIZE:
                    self.send_json(
                        {
                            "error": (
                                "Image is too large. "
                                "Please choose a smaller image."
                            )
                        },
                        413
                    )
                    return

            # ---------------------------------------------
            # EMPTY MESSAGE CHECK
            # ---------------------------------------------

            if not question and not image:
                self.send_json(
                    {
                        "error": (
                            "Please enter a message "
                            "or attach an image."
                        )
                    },
                    400
                )
                return

            # ---------------------------------------------
            # OPENROUTER KEY
            # ---------------------------------------------

            api_key = os.environ.get(
                "OPENROUTER_API_KEY"
            )

            if not api_key:
                print(
                    "API ERROR: OPENROUTER_API_KEY missing"
                )

                self.send_json(
                    {
                        "error": (
                            "AI service is not configured."
                        )
                    },
                    500
                )
                return

            # ---------------------------------------------
            # BUILD CONTENT
            # ---------------------------------------------

            content = []

            if question:
                content.append(
                    {
                        "type": "text",
                        "text": question,
                    }
                )

            if image:
                content.append(
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image
                        },
                    }
                )

            # ---------------------------------------------
            # OPENROUTER
            # ---------------------------------------------

            client = OpenAI(
                base_url=(
                    "https://openrouter.ai/api/v1"
                ),
                api_key=api_key,
            )

            response = client.chat.completions.create(
                model="qwen/qwen3.7-flash",
                messages=[
                    {
                        "role": "user",
                        "content": content,
                    }
                ],
            )

            # ---------------------------------------------
            # EXTRACT ANSWER
            # ---------------------------------------------

            if (
                not response.choices
                or not response.choices[0].message
            ):
                raise RuntimeError(
                    "AI returned an empty response."
                )

            answer = (
                response
                .choices[0]
                .message
                .content
                or ""
            )

            answer = str(answer).strip()

            if not answer:
                answer = (
                    "I couldn't generate a response."
                )

            # ---------------------------------------------
            # SUCCESS
            # ---------------------------------------------

            self.send_json(
                {
                    "answer": answer,
                    "image": image or None,
                }
            )

        except ValueError:
            self.send_json(
                {
                    "error": (
                        "Invalid request."
                    )
                },
                400
            )

        except Exception as error:
            print(
                "API ERROR:",
                repr(error)
            )

            # Don't expose internal backend details
            # to users.
            self.send_json(
                {
                    "error": (
                        "Something went wrong while "
                        "processing your request."
                    )
                },
                500
            )

    # =====================================================
    # OPTIONS
    # =====================================================

    def do_OPTIONS(self):
        self.send_response(204)

        self.send_cors_headers()

        self.end_headers()

    # =====================================================
    # SUPABASE AUTH
    # =====================================================

    def verify_user(self, access_token):
        """
        Verify the Supabase access token by asking
        Supabase Auth for the authenticated user.

        This avoids trusting user information supplied
        by the browser.
        """

        supabase_url = os.environ.get(
            "VITE_SUPABASE_URL"
        )

        supabase_anon_key = os.environ.get(
            "VITE_SUPABASE_ANON_KEY"
        )

        if not supabase_url:
            print(
                "AUTH ERROR: VITE_SUPABASE_URL missing"
            )
            return None

        if not supabase_anon_key:
            print(
                "AUTH ERROR: "
                "VITE_SUPABASE_ANON_KEY missing"
            )
            return None

        try:
            import urllib.request

            url = (
                supabase_url.rstrip("/")
                + "/auth/v1/user"
            )

            request = urllib.request.Request(
                url,
                method="GET",
                headers={
                    "apikey": supabase_anon_key,
                    "Authorization": (
                        f"Bearer {access_token}"
                    ),
                },
            )

            with urllib.request.urlopen(
                request,
                timeout=10
            ) as response:

                if response.status != 200:
                    return None

                raw = response.read()

                user = json.loads(raw)

                return user.get("id")

        except Exception as error:
            print(
                "AUTH ERROR:",
                repr(error)
            )
            return None

    # =====================================================
    # CORS
    # =====================================================

    def send_cors_headers(self):
        allowed_origin = os.environ.get(
            "ALLOWED_ORIGIN",
            "*"
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            allowed_origin
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "POST, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        )

        self.send_header(
            "Access-Control-Max-Age",
            "86400"
        )

    # =====================================================
    # JSON RESPONSE
    # =====================================================

    def send_json(
        self,
        data,
        status_code=200
    ):
        response = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status_code)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Content-Length",
            str(len(response))
        )

        self.send_header(
            "Cache-Control",
            "no-store"
        )

        self.send_cors_headers()

        self.end_headers()

        self.wfile.write(response)