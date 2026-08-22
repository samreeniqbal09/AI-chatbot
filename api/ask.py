import os
import json
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

            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )

            length = int(
                self.headers.get("Content-Length", "0")
            )

            body = self.rfile.read(length)
            data = json.loads(body)

            question = str(
                data.get("question", "")
            ).strip()

            if not question:
                self.send_json(
                    {"answer": "Please enter a message."},
                    400
                )
                return

            response = client.chat.completions.create(
                model="meta-llama/llama-3.1-8b-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            )

            answer = response.choices[0].message.content

            self.send_json(
                {
                    "answer": answer,
                    "image": None
                },
                200
            )

        except Exception as e:

            print("API ERROR:", repr(e))

            self.send_json(
                {
                    "answer": "Backend error.",
                    "error": str(e)
                },
                500
            )

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

    def send_json(self, data, status_code=200):

        response = json.dumps(data).encode("utf-8")

        self.send_response(status_code)

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

        self.wfile.write(response)