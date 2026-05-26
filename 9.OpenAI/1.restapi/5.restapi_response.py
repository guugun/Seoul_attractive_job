
import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

user_input = input("대한민국의 수도는 어디야? ")
response = requests.post(
    'https://api.openai.com/v1/chat/completions',
    'https://api.openai.com/v1/chat/responses',

    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {OPENAI_API_KEY}'
    },
    json={'model': 'gpt-4o-mini',
          'input': user_input}
)

data = response.json()
print(data)
print('-'*30)
answer = data['output'][0]['content'][0]['text']
print("챗봇 응답:", answer)
print('응답ID:', data['id'])

