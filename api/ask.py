import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

from openai import OpenAI


# =========================================================
# CONFIG
# =========================================================

MAX_REQUEST_SIZE = 8 * 1024 * 1024
MAX_QUESTION_LENGTH = 12000
MESSAGE_LIMIT = 100


# =========================================================
# HANDLER
# =========================================================

class handler(BaseHTTPRequestHandler):

    # =====================================================
    # POST
    # =====================================================

    def do_POST(self):
        try:
            # -------------------------------------------------
            # CORS / ORIGIN
            # -------------------------------------------------

            origin = self.headers.get("Origin", "")
            allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")

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

            # -------------------------------------------------
            # AUTHENTICATION
            # -------------------------------------------------

            authorization = self.headers.get("Authorization", "")

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
                    {"error": "Invalid authentication token."},
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

            # -------------------------------------------------
            # RATE LIMIT
            # -------------------------------------------------

            rate_result = self.check_supabase_limit(
                access_token,
                user_id
            )

            if rate_result is None:
                self.send_json(
                    {
                        "error": (
                            "Unable to check message limit. "
                            "Please try again."
                        )
                    },
                    500
                )
                return

            if not rate_result.get("allowed", False):
                retry_minutes = max(
                    1,
                    int(rate_result.get("retry_after_minutes", 1))
                )

                self.send_json(
                    {
                        "error": (
                            "You've reached your message limit. "
                            f"Please try again in {retry_minutes} "
                            "minutes."
                        ),
                        "rate_limited": True,
                        "retry_after_minutes": retry_minutes,
                        "remaining": 0,
                    },
                    429,
                    retry_after=retry_minutes * 60
                )
                return

            # -------------------------------------------------
            # CONTENT LENGTH
            # -------------------------------------------------

            try:
                content_length = int(
                    self.headers.get("Content-Length", "0")
                )
            except ValueError:
                content_length = 0

            if content_length <= 0:
                self.send_json(
                    {"error": "Empty request."},
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

            # -------------------------------------------------
            # READ BODY
            # -------------------------------------------------

            body = self.rfile.read(content_length)

            if not body:
                self.send_json(
                    {"error": "Empty request."},
                    400
                )
                return

            # -------------------------------------------------
            # PARSE JSON
            # -------------------------------------------------

            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self.send_json(
                    {"error": "Invalid request data."},
                    400
                )
                return

            if not isinstance(data, dict):
                self.send_json(
                    {"error": "Invalid request format."},
                    400
                )
                return

            # -------------------------------------------------
            # QUESTION
            # -------------------------------------------------

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

            # -------------------------------------------------
            # IMAGE
            # -------------------------------------------------

            image = data.get("image")

            if image is not None:
                if not isinstance(image, str):
                    self.send_json(
                        {"error": "Invalid image data."},
                        400
                    )
                    return

                if not image.startswith("data:image/"):
                    self.send_json(
                        {"error": "Invalid image format."},
                        400
                    )
                    return

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

            # -------------------------------------------------
            # EMPTY MESSAGE
            # -------------------------------------------------

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

            # -------------------------------------------------
            # OPENROUTER KEY
            # -------------------------------------------------

            api_key = os.environ.get("OPENROUTER_API_KEY")

            if not api_key:
                print("API ERROR: OPENROUTER_API_KEY missing")

                self.send_json(
                    {"error": "AI service is not configured."},
                    500
                )
                return

            # -------------------------------------------------
            # BUILD CONTENT
            # -------------------------------------------------

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

            # -------------------------------------------------
            # OPENROUTER
            # -------------------------------------------------

            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
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

            # -------------------------------------------------
            # EXTRACT ANSWER
            # -------------------------------------------------

            if (
                not response.choices
                or not response.choices[0].message
            ):
                raise RuntimeError(
                    "AI returned an empty response."
                )

            answer = str(
                response.choices[0].message.content or ""
            ).strip()

            if not answer:
                answer = "I couldn't generate a response."

            # -------------------------------------------------
            # SUCCESS
            # -------------------------------------------------

            self.send_json(
                {
                    "answer": answer,
                    "image": image or None,
                    "remaining": rate_result.get("remaining"),
                }
            )

        except ValueError:
            self.send_json(
                {"error": "Invalid request."},
                400
            )

        except Exception as error:
            print("API ERROR:", repr(error))

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
        supabase_url = os.environ.get("VITE_SUPABASE_URL")
        supabase_anon_key = os.environ.get(
            "VITE_SUPABASE_ANON_KEY"
        )

        if not supabase_url or not supabase_anon_key:
            print("AUTH ERROR: Supabase environment variables missing")
            return None

        try:
            url = (
                supabase_url.rstrip("/")
                + "/auth/v1/user"
            )

            request = urllib.request.Request(
                url,
                method="GET",
                headers={
                    "apikey": supabase_anon_key,
                    "Authorization": f"Bearer {access_token}",
                },
            )

            with urllib.request.urlopen(
                request,
                timeout=10
            ) as response:

                if response.status != 200:
                    return None

                user = json.loads(response.read())
                return user.get("id")

        except Exception as error:
            print("AUTH ERROR:", repr(error))
            return None

    # =====================================================
    # SUPABASE RATE LIMIT
    # =====================================================

    def check_supabase_limit(
        self,
        access_token,
        user_id
    ):
        supabase_url = os.environ.get("VITE_SUPABASE_URL")
        supabase_anon_key = os.environ.get(
            "VITE_SUPABASE_ANON_KEY"
        )

        if not supabase_url or not supabase_anon_key:
            print("RATE LIMIT ERROR: Supabase environment variables missing")
            return None

        try:
            url = (
                supabase_url.rstrip("/")
                + "/rest/v1/rpc/check_message_limit"
            )

            payload = json.dumps(
                {
                    "p_user_id": user_id,
                    "p_limit": MESSAGE_LIMIT,
                }
            ).encode("utf-8")

            request = urllib.request.Request(
                url,
                data=payload,
                method="POST",
                headers={
                    "apikey": supabase_anon_key,
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
            )

            with urllib.request.urlopen(
                request,
                timeout=10
            ) as response:

                if response.status != 200:
                    print(
                        "RATE LIMIT ERROR: "
                        f"Supabase returned {response.status}"
                    )
                    return None

                return json.loads(response.read())

        except urllib.error.HTTPError as error:
            try:
                error_body = error.read().decode(
                    "utf-8",
                    errors="replace"
                )
            except Exception:
                error_body = ""

            print(
                "RATE LIMIT HTTP ERROR:",
                error.code,
                error_body
            )

            return None

        except Exception as error:
            print("RATE LIMIT ERROR:", repr(error))
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
        status_code=200,
        retry_after=None
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

        if retry_after is not None:
            self.send_header(
                "Retry-After",
                str(int(retry_after))
            )

        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(response)