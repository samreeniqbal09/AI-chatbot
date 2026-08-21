import os
import json
from http.server import BaseHTTPRequestHandler
from openai import OpenAI

API_KEY = os.environ.get("OPENROUTER_API_KEY")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY
)


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            body = self.rfile.read(content_length)
            data = json.loads(body)

            question = data.get("question", "").strip()

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
                        "role": "system",
                        "content": (
                            "You are Lumora AI, a helpful chatbot. "
                            "Answer clearly and naturally."
                        )
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            )

            answer = response.choices[0].message.content

            self.send_json(
                {"answer": answer},
                200
            )

        except Exception as e:
            print("API ERROR:", str(e))

            self.send_json(
                {"answer": f"Error: {str(e)}"},
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

        self.send_cors_headers()

        self.end_headers()

        self.wfile.write(response)