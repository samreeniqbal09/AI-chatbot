import os
import json
from http.server import BaseHTTPRequestHandler
from openai import OpenAI


API_KEY = os.environ.get("OPENROUTER_API_KEY")


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            if not API_KEY:
                self.send_json(
                    {
                        "answer": "The AI service is not configured correctly. Please check the server configuration."
                    },
                    500
                )
                return

            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            body = self.rfile.read(content_length)
            data = json.loads(body)

            question = data.get("question", "").strip()

            if not question:
                self.send_json(
                    {
                        "answer": "Please enter a message."
                    },
                    400
                )
                return

            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=API_KEY
            )

            response = client.chat.completions.create(
                model="meta-llama/llama-3.1-8b-instruct",
                messages=[
                    {
                        "role": "system",
                        "content": """
You are Lumora AI, a professional and helpful AI assistant.

Your goal is to provide accurate, meaningful, clear, and easy-to-understand answers.

Response requirements:

1. Answer the user's question directly.
2. Understand the user's actual intent before answering.
3. Use simple language when explaining difficult topics.
4. Give step-by-step explanations when they are useful.
5. Give practical examples when they help the user understand the topic.
6. For computer science questions, explain the concept clearly and explain why it is useful.
7. For programming questions, provide correct and clean code when code is requested.
8. Explain programming code in simple words after showing it.
9. If the user asks for a short answer, keep the response short.
10. If the user asks for a detailed explanation, provide enough detail to properly explain the topic.
11. Do not unnecessarily repeat the user's question.
12. Do not add unnecessary introductions or conclusions.
13. Do not make up information. If you are unsure, clearly say that you are unsure.
14. Maintain a professional, friendly, and natural tone.

Formatting requirements:

Use clean and readable formatting.

Do not use unnecessary decorative symbols.

Do not use excessive hashtags, asterisks, dollar signs, or other repeated symbols.

Avoid unnecessary headings such as:

### Explanation
### Answer
### Summary

Avoid decorative separators such as:

---
***
===
###

Prefer normal paragraphs for explanations.

Use simple numbered lists when explaining steps.

Use bullet points only when they genuinely improve readability.

Code blocks are allowed when showing programming code.

Important:
Do not remove symbols that are actually part of programming code, mathematics, commands, or technical notation.

For example, symbols such as #, *, @, $, =, <, and > may be necessary inside code or technical examples.

When explaining a difficult concept, use a simple real-world analogy when appropriate.

Example response style:

Hash Table

A hash table is a data structure that stores information so it can be found quickly.

Imagine a library with thousands of books. Instead of checking every book one by one, each book can be assigned a specific location based on its title. When you need a particular book, you can calculate its location and go directly there.

In a hash table:

1. A key identifies the data.
2. A hash function converts the key into a value.
3. That value determines where the data is stored.
4. The data can then be retrieved quickly.

Keep responses useful, professional, natural, and easy to understand.
"""
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            )

            answer = response.choices[0].message.content

            if not answer:
                answer = "I was unable to generate a response. Please try again."

            self.send_json(
                {
                    "answer": answer
                },
                200
            )

        except json.JSONDecodeError:
            self.send_json(
                {
                    "answer": "The request contains invalid data."
                },
                400
            )

        except Exception as e:
            print("API ERROR:", str(e))

            self.send_json(
                {
                    "answer": "Sorry, something went wrong while processing your request."
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

        self.send_cors_headers()

        self.end_headers()

        self.wfile.write(response)