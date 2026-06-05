# pip install anthropic

import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic()

def ask(question):
    print("질문: ", question)

    messages.append({"role": "user", "content": question})

    message = client.messages.create(
        #haiku, sonnet, opus
        model="claude-haiku-4-5",
        max_tokens=300,
        messages=messages
    )

print(message.content[0].text)













