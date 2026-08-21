import os
import json
import requests
from http.server import BaseHTTPRequestHandler
from openai import OpenAI


API_KEY = os.environ.get("OPENROUTER_API_KEY")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

TEXT_MODEL = "meta-llama/llama-3.1-8b-instruct"
VISION_MODEL = "google/gemini-2.5-flash"
IMAGE_MODEL = "google/gemini-2.5-flash-image"


SYSTEM_PROMPT = (
    "You are Lumora AI, a professional, helpful and friendly AI assistant. "
    "Answer clearly, directly and meaningfully. "
    "Use simple, natural and professional language. "
    "Give useful explanations and examples when appropriate. "
    "For programming questions, explain concepts clearly and provide "
    "clean code when requested. "
    "When analyzing an image, describe what is visible and answer "
    "the user's question about it accurately. "
    "Do not repeat the user's question. "
    "Keep answers clear, organized and professional."
)


def wants_image(question):
    text = question.lower()

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
        "generate a diagram",
        "create a diagram",
        "make a diagram",
    )

    return any(trigger in text for trigger in triggers)


def generate_image(prompt):
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

    if not response.ok:
        raise RuntimeError(
            f"Image generation failed: "
            f"{response.status_code}"
        )

    result = response.json()
    images = result.get("data", [])

    if not images:
        raise RuntimeError(
            "No image was returned."
        )

    image_data = images[0].get("b64_json")

    if not image_data:
        raise RuntimeError(
            "Image data was not returned."
        )

    media_type = images[0].get(
        "media_type",
        "image/png"
    )

    return f"data:{media_type};base64,{image_data}"


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            content_length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            body = self.rfile.read(content_length)
            data = json.loads(body)

            question = data.get(
                "question",
                ""
            ).strip()

            image = data.get("image")

            if not question and not image:
                self.send_json(
                    {
                        "answer": (
                            "Please enter a message "
                            "or add an image."
                        )
                    },
                    400,
                )
                return

            # ---------------------------------
            # IMAGE GENERATION
            # Only runs when explicitly requested
            # ---------------------------------

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

            # ---------------------------------
            # IMAGE + TEXT
            # Vision model
            # ---------------------------------

            if image:

                user_content = [
                    {
                        "type": "text",
                        "text": (
                            question
                            or
                            "Please analyze this image "
                            "and explain it clearly."
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

            # ---------------------------------
            # TEXT ONLY
            # Fast normal chatbot
            # ---------------------------------

            else:

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

            answer = (
                response
                .choices[0]
                .message
                .content
            )

            self.send_json(
                {
                    "answer": answer,
                    "image": None,
                },
                200,
            )

        except Exception as e:

            print("API ERROR:", str(e))

            self.send_json(
                {
                    "answer": (
                        "Sorry, something went wrong."
                    ),
                    "error": str(e),
                },
                500,
            )

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        self.send_header(
            "Access-Control-Allow-Origin",
            "*",
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "POST, OPTIONS",
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type",
        )

    def send_json(
        self,
        data,
        status_code=200,
    ):
        response = json.dumps(
            data
        ).encode("utf-8")

        self.send_response(
            status_code
        )

        self.send_header(
            "Content-Type",
            "application/json",
        )

        self.send_cors_headers()

        self.end_headers()

        self.wfile.write(
            response
        )