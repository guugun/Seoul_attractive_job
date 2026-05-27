# 1. openai 관련 라이브러리를 다 불러온다 (dotenv, openai 등등)
# 2. OOO 페이지 (우리의 최종 페이지) 에서 채팅창 FE 를 만든다.
# 3-1. 그 FORM의 입력값을 BE에서 POST로 받아서, chatgpt API 호출한다. (그냥 아무말이나 해도 됨.)
# 3-2. 응답 받아서 다시 프런트엔드에 반환해서 결과 출력한다. 
# 3-3. [추가] 복습을 원하면 SSE 기반에 스트리밍 구현해봐도 됨
# 4. 그럼 이제, 진짜 우리의 이 상황 (학년, 커리큐럼) 에 대해서 영어로 대화를 하도록 만든다.
# 5. [추가] 메모리를 통해서 대화 내용 컨텍스트를 기억하게 한다.

# 환경 변수 불러온다
import os
from dotenv import load_dotenv

# 웹서비스 기본 프레임워크
from flask import Flask, render_template, request, jsonify

# OpenAI 라이브러리
from openai import OpenAI

load_dotenv()

openai_api_key = os.environ.get('OPENAI_API_KEY')
client = OpenAI(api_key=openai_api_key)
app = Flask(__name__)

# 각 학년별 커리큐럼 데이터 - dict 자료 구조의 key-value
curriculums = {
    # key: [values]
    1: ['기초 인사', '간단한 문장', '동물 이름'],
    2: ['학교 생활', '가족 소개', '자기 소개'],
    3: ['취미와 운동', '날씨 묘사', '간단한 이야기'],  # 나중에 내용을 바꾸거나, 목록을 추가하거나 해볼것
    4: ['쇼핑과 가격', '음식 주문', '여행 이야기'],
    5: ['역사와 문화', '과학과 자연', '사회 이슈'],
    6: ['미래 걔획', '진로 탐색', '세계 여행'],
}

@app.route('/')
def home():
    return render_template('home.html', grades=curriculums.keys())

@app.route('/grade/<int:grade>')
def grade(grade):
    if grade in curriculums:
        curriculums_index = list(enumerate(curriculums[grade]))
        return render_template('grade.html', grade=grade, grades=curriculums.keys(), curriculums=curriculums_index)
    return "해당 학년은 존재하지 않습니다.", 404

@app.route('/grade/<int:grade>/curriculum/<int:curriculum_id>', methods=['GET', 'POST'])
def curriculum(grade, curriculum_id):
    if grade in curriculums and 0 <= curriculum_id < len(curriculums[grade]):
        curriculum_title = curriculums[grade][curriculum_id]

        # POST 처리하는곳
        if request.method == 'POST':
            user_input = request.form.get('user_input')
            print(f"학년: {grade}, 커리큐럼: {curriculum_title}, 사용자입력: {user_input}")

            # 실무적으로는, 이런 프롬프트 스테이트먼트를 별도 파일로 분리하는것이 더 좋음.
            system_prompt = f"""
당신은 {grade} 학년 영어 교사입니다.
학생의 영어 수준과 {curriculum_title} 커리큘럼에 맞춰 대화합니다.

규칙:
- 반드시 실제 교사처럼 자연스럽게 답변합니다.
- 설명문, 지침, 예시, 메타 발언을 절대 출력하지 않습니다.
- "학생:", "Teacher:" 같은 역할 라벨을 사용하지 않습니다.
- "학생이 대답하면", "예를 들어", "영어로 유도합니다" 같은 설명을 절대 출력하지 않습니다.
- 오직 학생에게 직접 말하는 답변만 출력합니다.
- 영어 질문에는 영어로 답변합니다.
- 한국어 질문에는 한국어와 쉬운 영어를 함께 사용합니다.
- 항상 학생이 영어로 한 문장 이상 답변하도록 자연스럽게 유도합니다.
- 답변은 짧고 자연스럽게 유지합니다.
"""

            user_prompt = f"""
학생의 질문:
{user_input}
"""

            print("우리가 GPT 에게 던질 SP: ", system_prompt)
            print("우리가 GPT 에게 던질 UP: ", user_prompt)

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    # 나는 여기 뭐라고 입력해서 그 사용자의 상황에 맞는 질문을 할것이냐?? 프롬프트 엔지니어링
                    { "role": "system", "content": system_prompt },
                    { "role": "user", "content": user_prompt }
                ]
            )
            chat_reply = response.choices[0].message.content
            return jsonify({"response": chat_reply})

        # GET 처리하는곳
        return render_template('curriculum.html', grade=grade, grades=curriculums.keys(), curriculum_title=curriculum_title)
    
    # 입력값에 오류가 있는 경우
    return "해당 커리큐럼은 존재하지 않습니다.", 404

# @app.route('/api/chat', methods=['POST'])
# def chat():
# 여기에서 분리된 API로 만들려면, 입력값에 학년, 커리큐럼 정보도 함께 보내서 파싱해야함

if __name__ == "__main__":
    app.run(debug=True)
