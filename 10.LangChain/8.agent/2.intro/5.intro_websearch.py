from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_tavily import TavilySearch

load_dotenv()

web_Search = TavilySearch(max_results=3)
llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_agent(llm, [web_Search])

result = agent.invoke({"messages":[("user", "langChain의 최신 버전은?")]})

print(result["messages"][-1].content)




























































