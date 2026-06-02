import wikipedia

from dotenv import load_dotenv

from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_community.utilities.wikipedia import WikipediaAPIWrapper
from langchain.agents import create_agent

load_dotenv()

wikipedia.wikipedia.USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3")
AppleWebkit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3


wiki_en = WikipediaQueryRun(
    api_wrapper = WikipediaAPIWrapper(lang="en", top_k_results=3),
    doc_content_chars_max =200, description="영문 위키피디아에서 정보를 검색하는 도구입니다."
)

llm = ChatOpenAI(model="gpt-4o-mini")

system_prompt = """
당신은 위키피디아에서 정보를 검색하는 도구입니다. 사용자가 질문을 하면, 위키피디아에서 검색해서 답변하시오.
"""

agent = create_agent(llm, [wiki_en], system_prompt=system_prompt)



import time
for q in questions:
    time.sleep(2)
    try:
        





