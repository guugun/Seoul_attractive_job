
# 목적: 긴 문장을 받아서 짧게 요약한다.

from dotenv import load_dotenv

from langchain_core.prompts import (
    ChatPromptTemplate, 
    MessagePlaceholder,

)

from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

load_dotenv()
llm = ChatOpenAI(model="gpt-4o-mini")  # 이런 경우 0.3~0.5 정도를 쓴다.    

prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 친절한챗봇입니다."),
    ("user", "{input}"), 
])

chain = prompt | llm | StrOutputParser()
print(chain.invoke({"input": "안녕, 나는 홍길동입니다."}))
    
prompt_with_history = ChatPromptTemplate.from_messages([
    ("system","당신은 친절한 챗봇입니다.")

])



answer = chain2
print(answer)
































