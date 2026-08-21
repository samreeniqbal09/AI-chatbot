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
        content_length = int(
            self.headers['Content-Length']
        )
        body = self.rfile.read(content_length)
        data = json.loads(body)
        question = data.get("question", "")
        try:
            response = client.chat.completions.create(
                model="nvidia/nemotron-3-ultra-550b-a55b:free",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful "
                        "chatbot. Always respond in plain "
                        "text. Do not use markdown, "
                        "hashtags, asterisks, or any "
                        "special formatting."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            )
            answer = response.choices[0].message.content
            result = {"answer": answer}
        except Exception as e:
            result = {"answer": f"Error: {str(e)}"}
        self.send_response(200)
        self.send_header(
            'Content-Type', 'application/json'
        )
        self.send_header(
            'Access-Control-Allow-Origin', '*'
        )
        self.send_header(
            'Access-Control-Allow-Methods',
            'POST, OPTIONS'
        )
        self.send_header(
            'Access-Control-Allow-Headers',
            'Content-Type'
        )
        self.end_headers()
        self.wfile.write(
            json.dumps(result).encode()
        )