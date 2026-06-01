# 목적 - 랭체인 멀티유저 세션기록 챗봇 (Flask 웹서비스)
#        1) 사용자 로그인 (SQLite 계정 관리)
#        2) 로그인한 사용자별로 대화내용을 구분해서 저장 (세션별 메모리)

from flask import Flask, request, jsonify
from flask import render_template, redirect, url_for, session, flash

import sqlite3
from dotenv import load_dotenv

# 프롬프트
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# 모델
from langchain_openai import ChatOpenAI

# 파서
from langchain_core.output_parsers import StrOutputParser

# 메모리 (대화내용 저장소) + 세션별 자동 관리 래퍼
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

load_dotenv()

app = Flask(__name__)
app.secret_key = "hello1234"  # 세션 암호화용 키 (실무에서는 커밋 금지!)

DATABASE = "users.sqlite3"


# ---------------------------------------------------------------
# 0) 사용자 계정 DB (SQLite)
# ---------------------------------------------------------------
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # 결과를 dict 처럼 컬럼명으로 접근 가능하게
    return conn


def init_db():
    with app.app_context():
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                password TEXT NOT NULL
            )""")

        # 기본 계정이 없으면 자동 생성
        cur.execute("SELECT COUNT(*) AS count FROM users")
        if cur.fetchone()["count"] == 0:
            cur.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                ("user1", "password1"),
            )
            cur.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                ("user2", "password2"),
            )

        # 부팅 시 계정 목록 출력
        print("-" * 30)
        for row in cur.execute("SELECT * FROM users").fetchall():
            print(row["id"], row["username"], row["password"])
        print("-" * 30)

        conn.commit()
        conn.close()


# ---------------------------------------------------------------
# 1) LangChain 체인 구성 (prompt | llm | parser)
# ---------------------------------------------------------------
llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "당신은 친절한 챗봇입니다. 경상도 사투리를 적절하게 섞어서 답변하시오.",
        ),
        MessagesPlaceholder(
            "history"
        ),  # <-- 이 공간에 해당 사용자의 대화내용이 들어간다
        ("user", "{input}"),
    ]
)

chain = prompt | llm | StrOutputParser()


# ---------------------------------------------------------------
# 2) 세션(사용자)별 대화 저장소 - 메모리(RAM)에 보관
# ---------------------------------------------------------------
# { "user1": InMemoryChatMessageHistory(), "user2": ... }
sessions: dict[str, InMemoryChatMessageHistory] = {}


def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    # 해당 사용자의 저장소가 없으면 새로 만들어 준다
    if session_id not in sessions:
        sessions[session_id] = InMemoryChatMessageHistory()
    return sessions[session_id]


# session_id 에 따라 위 저장소를 자동으로 꺼내고 저장해주는 체인
chain_with_memory = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)


# ---------------------------------------------------------------
# 3) 라우팅
# ---------------------------------------------------------------
@app.route("/")
def index():
    # 로그인 안 했으면 로그인 페이지로
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("chat.html", username=session["user"])


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM users WHERE username=? AND password=?", (username, password)
        )
        user_data = cur.fetchone()
        conn.close()

        if user_data:
            session["user"] = username  # 로그인 성공 -> 세션에 사용자 저장
            return redirect(url_for("index"))
        else:
            flash("로그인에 실패하였습니다. 아이디/비밀번호를 확인하세요.")
            return redirect(url_for("login"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))


@app.route("/api/history", methods=["GET"])
def history():
    # 로그인 안 한 사용자는 차단
    if "user" not in session:
        return jsonify({"error": "로그인이 필요합니다."}), 401

    user = session["user"]
    # 저장된 메시지를 {sender, text} 형태로 변환해서 내려준다
    messages = []
    for msg in get_session_history(user).messages:
        # langchain 메시지 타입: human(사용자) / ai(챗봇)
        sender = "user" if msg.type == "human" else "bot"
        messages.append({"sender": sender, "text": msg.content})

    return jsonify({"messages": messages})


@app.route("/api/chat", methods=["POST"])
def chat():
    # 로그인 안 한 사용자는 차단
    if "user" not in session:
        return jsonify({"error": "로그인이 필요합니다."}), 401

    user = session["user"]  # 로그인한 사용자 = 대화 구분 기준(session_id)
    data = request.get_json()
    chat_message = data.get("chatMessage", "")
    print(f"[{user}] 사용자 입력값: {chat_message}")

    # session_id 로 user 를 넘기면 사용자별 대화내용이 자동으로 분리/저장된다
    answer = chain_with_memory.invoke(
        {"input": chat_message},
        config={"configurable": {"session_id": user}},
    )

    print(f"[{user}] 답변: {answer}")
    print(
        f"[{user}] 현재까지 저장된 대화 수: {len(get_session_history(user).messages)}"
    )

    return jsonify({"reply": answer})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
