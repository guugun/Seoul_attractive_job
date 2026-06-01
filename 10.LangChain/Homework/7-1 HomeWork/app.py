# 목적 - 랭체인 메모리 기반 싱글유저 챗봇 (Flask 웹서비스)
#        사용자의 대화 내용을 기억한다. (InMemoryChatMessageHistory)

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# 프롬프트
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# 모델
from langchain_openai import ChatOpenAI

# 파서
from langchain_core.output_parsers import StrOutputParser

# 메모리 (대화내용 저장소)
from langchain_core.chat_history import InMemoryChatMessageHistory

load_dotenv()

app = Flask(
    __name__, static_folder="static", static_url_path=""
)  # static 폴더 경로와 그 prefix 를 결정(변경) 할 수 있음

# ---------------------------------------------------------------
# LangChain 체인 구성 (prompt | llm | parser)
# ---------------------------------------------------------------
llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "당신은 친절한 챗봇입니다. 경상도 사투리를 적절하게 섞어서 답변하시오.",
        ),
        MessagesPlaceholder("history"),  # <-- 이 공간에 지금까지의 대화내용이 들어간다
        ("user", "{input}"),
    ]
)

chain = prompt | llm | StrOutputParser()

# 싱글유저용 대화 저장소 (메모리)
history = InMemoryChatMessageHistory()


@app.route("/")
def index():
    return send_from_directory("static", "index.html")




@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    chat_message = data.get("chatMessage", "")
    print("사용자 입력값: ", chat_message)

    # 지금까지의 대화내용(history)을 함께 넘겨서 챗봇이 기억하도록 한다
    answer = chain.invoke(
        {
            "input": chat_message,
            "history": history.messages[-10:],  # 최근 10개의 대화만 기억
        }
    )

    # 이번 대화내용을 저장소에 추가 (다음 질문 때 기억하기 위해)
    history.add_user_message(chat_message)
    history.add_ai_message(answer)

    print(">>>>>>>>>>")
    print("현재까지 저장된 대화 수: ", len(history.messages))
    print("<<<<<<<<<<")

    return jsonify({"reply": answer})


if __name__ == "__main__":
    app.run(debug=True)
