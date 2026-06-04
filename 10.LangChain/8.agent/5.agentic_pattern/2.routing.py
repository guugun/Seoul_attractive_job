from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.parser import StrOutputParser

load_dotenv()


llm = ChatOpenAI(model="gpt-4o-mini")
parser = StrOutputParser()


test_questions = [
    ""
]



























