import wikipedia
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits.load_tools import load_tools
from langchain.agents import create_agent

load_dotenv()

tools = load_tools(["wikipedia"])
llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_agent(llm, tools)

result =  agent.invoke({"message": [("user", "파이썬 프로그래밍 언어")]})
print(result)



























