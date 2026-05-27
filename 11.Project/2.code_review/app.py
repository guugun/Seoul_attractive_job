import os
from dotenv import load_dotenv

from flask import Flask, send_from_directory, jsonify, request

from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
app = Flask(__name__, static_folder="public")

@app.route("/")
def index():
    return send_from_directory("public", "index.html")

@app.route('/api/codecheck', methods=['POST'])
def code_check():
    # 데이터를 JSON 형태로 받아온다
    code = request.get_json()
    # print(code)

    prompt = (
        "다음 소스코드를 보고 취약점을 분석하시오.\n"
        "각 취약점에 대해 해당 코드의 라인 번호, 코드 스니펫, 취약점 설명과 개선 방안을 간단하게 설명하시오. 코드 내의 주석은 무시해도 됩니다.\n\n"
        "소스코드:\n"
        "----------\n"
        f"{code}\n"
        "----------\n"
    )
    print("실제로우리가질문할내용:", prompt)

    # chatgpt API로 요청한다.
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "당신은 소스코드 분석 보안 전문가입니다."},
            {"role": "user", "content": prompt}
        ]
    )
    chatbot_reply = response.choices[0].message.content

    # 응답을 받아와서 반환한다.
    return jsonify({"result": chatbot_reply})

if __name__ == "__main__":
    app.run(debug=True)
