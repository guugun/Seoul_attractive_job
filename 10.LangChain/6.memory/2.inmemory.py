










# 목적: 긴 문장을 받아서 짧게 요약한다.

from dotenv import load_dotenv

from langchain_core.prompts import (
    ChatPromptTemplate, 
    MessagePlaceholder,

)

from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

from langchain_core.chat_history import InMemoryChatHistory

load_dotenv()

llm = ChatOpenAI(model="gpt-4o-mini")  # 이런 경우 0.3~0.5 정도를 쓴다.    


prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 친절한챗봇입니다."),
    MessagePlaceholder(variable_name="history"),
    ("user", "{input}"), 
])


chain = prompt | llm | StrOutputParser()

history = InMemoryChatMessageHistory()

def chat(message):
    print(f"질문: {message}")
    answer = chain.invoke({
        "input": message, 
        "history": history.messages})

    print(f"답변: {answer}")
    history.add_user_message(message)
    history.add_ai_message(answer)


chat("안녕하세요.")
chat("제 이름은 곽길동입니다.")
chat("저는 겨울에 바닷가에 가서 서핑하는 것을 좋아합니다.")
chat("제 이름과 취미가 뭐라고했죠?")

questions = [
    "요즘 파이썬으로 챗봇을 만들고 있는데 어떻게 시작해야 할까요?",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",

]













