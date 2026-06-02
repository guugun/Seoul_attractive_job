

from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from langchain.agents import create_agent




@tool
def calculator(expression: str) -> str:
    """수학 계산을 수행하는 도구입니다."""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"계산 오류: {e}"
llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_agent(llm, [calculator])

result = agent.invoke({
    "messages":[("", )]
})









