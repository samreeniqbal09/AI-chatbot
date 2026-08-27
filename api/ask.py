import json
import os
from http.server import BaseHTTPRequestHandler

from openai import OpenAI


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            api_key = os.environ.get("OPENROUTER_API_KEY")

            if not api_key:
                raise RuntimeError(
                    "OPENROUTER_API_KEY is missing in Vercel."
                )

            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length)

            if not body:
                self.send_json({"answer": "Empty request."}, 400)
                return

            data = json.loads(body)

            question = str(data.get("question", "")).strip()
            image = data.get("image")

            if not question and not image:
                self.send_json(
                    {
                        "answer": (
                            "Please enter a message "
                            "or attach an image."
                        )
                    },
                    400,
                )
                return

            content = []

            if question:
                content.append(
                    {
                        "type": "text",
                        "text": question,
                    }
                )

            if image:
                if not isinstance(image, str):
                    self.send_json(
                        {"answer": "Invalid image data."},
                        400,
                    )
                    return

                if not image.startswith("data:image/"):
                    self.send_json(
                        {"answer": "Invalid image format."},
                        400,
                    )
                    return

                content.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": image},
                    }
                )

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

            answer = (
                response.choices[0].message.content
                or "I couldn't generate a response."
            )

            self.send_json(
                {
                    "answer": answer,
                    "image": image or None,
                }
            )

        except json.JSONDecodeError:
            self.send_json(
                {"answer": "Invalid request data."},
                400,
            )

        except Exception as error:
            print("API ERROR:", repr(error))

            self.send_json(
                {
                    "answer": "Backend error.",
                    "error": str(error),
                },
                500,
            )

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods",
            "POST, OPTIONS",
        )
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type",
        )

    def send_json(self, data, status_code=200):
        response = json.dumps(data).encode("utf-8")

        self.send_response(status_code)
        self.send_header(
            "Content-Type",
            "application/json",
        )
        self.send_header(
            "Content-Length",
            str(len(response)),
        )

        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(response)