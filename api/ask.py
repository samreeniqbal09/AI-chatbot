import os
import json
import requests
from http.server import BaseHTTPRequestHandler
from openai import OpenAI


# ==============================
# CONFIGURATION
# ==============================

API_KEY = os.environ.get("OPENROUTER_API_KEY")

TEXT_MODEL = "meta-llama/llama-3.1-8b-instruct"
VISION_MODEL = "google/gemini-2.5-flash"
IMAGE_MODEL = "google/gemini-2.5-flash-image"


# ==============================
# OPENROUTER CLIENT
# ==============================

def get_client():
    if not API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured."
        )

    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=API_KEY,
    )


# ==============================
# SYSTEM PROMPT
# ==============================

SYSTEM_PROMPT = (
    "You are Lumora AI, a professional, helpful and friendly AI assistant. "
    "Answer clearly, directly and meaningfully. "
    "Use simple, natural and professional language. "
    "Give useful explanations and examples when appropriate. "
    "For programming questions, explain concepts clearly and provide "
    "clean code when requested. "
    "When analyzing an image, describe what is visible and answer "
    "the user's question accurately. "
    "Do not repeat the user's question. "
    "Keep answers clear, organized and professional."
)


# ==============================
# IMAGE REQUEST DETECTION
# ==============================

def wants_image(question):
    text = question.lower().strip()

    triggers = (
        "generate an image",
        "generate image",
        "create an image",
        "create image",
        "make an image",
        "make image",
        "show me an image",
        "show an image",
        "draw an image",
        "generate a picture",
        "create a picture",
        "make a picture",
        "generate a diagram",
        "create a diagram",
        "make a diagram",
        "draw a diagram",
    )

    return any(
        trigger in text
        for trigger in triggers
    )


# ==============================
# IMAGE GENERATION
# ==============================

def generate_image(prompt):

    if not API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured."
        )

    response = requests.post(
        "https://openrouter.ai/api/v1/images",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": IMAGE_MODEL,
            "prompt": prompt,
        },
        timeout=120,
    )

    # Keep the real API error
    # so debugging is easier.
    if not response.ok:
        try:
            error_data = response.json()
            error_message = error_data.get(
                "error",
                error_data
            )
        except Exception:
            error_message = response.text

        raise RuntimeError(
            f"Image API error "
            f"{response.status_code}: "
            f"{error_message}"
        )

    result = response.json()

    images = result.get("data") or []

    if not images:
        raise RuntimeError(
            "The image API returned no image."
        )

    first_image = images[0]

    image_data = first_image.get(
        "b64_json"
    )

    if not image_data:
        raise RuntimeError(
            "The image API did not return image data."
        )

    media_type = first_image.get(
        "media_type",
        "image/png"
    )

    return (
        f"data:{media_type};base64,"
        f"{image_data}"
    )


# ==============================
# API HANDLER
# ==============================

class handler(BaseHTTPRequestHandler):

    def do_POST(self):

        try:

            content_length = int(
                self.headers.get(
                    "Content-Length",
                    "0"
                )
            )

            body = self.rfile.read(
                content_length
            )

            data = json.loads(body)

            question = str(
                data.get("question") or ""
            ).strip()

            image = data.get("image")

            # ==========================
            # EMPTY REQUEST
            # ==========================

            if not question and not image:

                self.send_json(
                    {
                        "answer": (
                            "Please enter a message "
                            "or add an image."
                        ),
                        "image": None,
                    },
                    400,
                )

                return

            # ==========================
            # IMAGE GENERATION
            # ==========================

            if question and wants_image(question):

                generated_image = generate_image(
                    question
                )

                self.send_json(
                    {
                        "answer": (
                            "Here is the image "
                            "you requested."
                        ),
                        "image": generated_image,
                    },
                    200,
                )

                return

            # ==========================
            # IMAGE ANALYSIS
            # ==========================

            if image:

                if not isinstance(
                    image,
                    str
                ):
                    raise ValueError(
                        "Invalid image data."
                    )

                if not image.startswith(
                    "data:image/"
                ):
                    raise ValueError(
                        "Invalid image format."
                    )

                client = get_client()

                user_content = [
                    {
                        "type": "text",
                        "text": (
                            question
                            or
                            "Analyze this image "
                            "and explain what you see "
                            "clearly."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image
                        },
                    },
                ]

                response = (
                    client.chat.completions.create(
                        model=VISION_MODEL,
                        messages=[
                            {
                                "role": "system",
                                "content": SYSTEM_PROMPT,
                            },
                            {
                                "role": "user",
                                "content": user_content,
                            },
                        ],
                    )
                )

            # ==========================
            # NORMAL TEXT CHAT
            # ==========================

            else:

                client = get_client()

                response = (
                    client.chat.completions.create(
                        model=TEXT_MODEL,
                        messages=[
                            {
                                "role": "system",
                                "content": SYSTEM_PROMPT,
                            },
                            {
                                "role": "user",
                                "content": question,
                            },
                        ],
                    )
                )

            # ==========================
            # GET AI ANSWER
            # ==========================

            if not response.choices:

                raise RuntimeError(
                    "AI returned no response."
                )

            answer = (
                response
                .choices[0]
                .message
                .content
            )

            if not answer:

                raise RuntimeError(
                    "AI returned an empty response."
                )

            # ==========================
            # SUCCESS
            # ==========================

            self.send_json(
                {
                    "answer": answer,
                    "image": None,
                },
                200,
            )

        except Exception as e:

            print(
                "API ERROR:",
                repr(e)
            )

            self.send_json(
                {
                    "answer": (
                        "Sorry, something went wrong."
                    ),
                    "error": str(e),
                    "image": None,
                },
                500,
            )

    # ==============================
    # CORS
    # ==============================

    def do_OPTIONS(self):

        self.send_response(204)

        self.send_cors_headers()

        self.end_headers()

    def send_cors_headers(self):

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "POST, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )

    # ==============================
    # JSON RESPONSE
    # ==============================

    def send_json(
        self,
        data,
        status_code=200
    ):

        response = json.dumps(
            data
        ).encode("utf-8")

        self.send_response(
            status_code
        )

        self.send_header(
            "Content-Type",
            "application/json"
        )

        self.send_header(
            "Content-Length",
            str(len(response))
        )

        self.send_cors_headers()

        self.end_headers()

        self.wfile.write(
            response
        )