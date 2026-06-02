import json
from typing import Literal
from pydantic import BaseModel, Field

from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchian.agents import create_agent

load_dotenv()

class SendEmailInput(BaseModel):
    """이메일 전송 도구의 인자"""
    to: str = Field(description="수신자 이메일 주소")
    subject: str = Field(description="이메일 제목(50자 이내, 간결하게)")
    body: str = Field(description="이메일 본문(반드시 한국어로 작성)")
    priority: Literal["low", "normal", "high"] = Field(default="normal", description="우선순위. urgent한 경우에는 high 사용")

@tool(args_schema=SendEmailInput)
def send_email(to: str, subject: str, body: str, priority: str="normal") -> str:
    """사용자가 요청할때 이메일을 보낸다."""
print(f"")
return f""










