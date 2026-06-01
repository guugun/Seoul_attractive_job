# 표준 LCEL 로 RAG 모델을 구현하기

import os
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

load_dotenv()

# 1. 백터 스토어(DB) 정의하기
DB_DIR="./chroma_db"
COLLECTION_NAME = "my_rag"

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

store = Chroma(collection_name=COLLECTION_NAME, embedding_function=embeddings, persist_directory=DB_DIR)

if store._collection.count() == 0:
    docs = TextLoader("./nvme.txt", encoding="utf-8").load() \
         + TextLoader("./hbm.txt", encoding="utf-8").load()

    chunks = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100).split_documents(docs)
    for c in chunks:
        c.metadata["source"] = os.path.basename(c.metadata.get("source", "?"))

    store.add_documents(chunks)

retriever = store.as_retriever(search_kwargs={"k": 3})


# 2. LLM + 프롬프트 설계하기
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 문서 기반 QA시스템입니다. 반드시 아래 문서(Context)만 참고해서 답변하세요.\n"
               "답변 규칙:\n"
               "1) 핵심 답변을 번호 목록(1., 2., 3. ...)으로 작성하세요.\n"
               "2) 각 답변 항목 끝에 반드시 [근거: n] 형태로 근거 문서 번호를 붙이세요.\n"
               "3) 근거 번호 n은 Context의 [n] 번호와 반드시 일치해야 합니다.\n"
               "4) 모르면 추측하지 말고 '문서에서 확인 불가'라고 작성하세요."),
    ("user", "질문: {question}\n\n[Context]\n{context}")
])


# 3. 표준 질의응답을 위한 파이프라인 설계 (체이닝)
def format_docs(docs):
    # 각 문서를 [번호] 형태로 고정해 답변의 근거 번호와 정확히 매칭한다.
    return "\n\n".join(f"[{i}] {d.page_content}" for i, d in enumerate(docs, start=1))

#HW. 아래 코드에서 개별 답변 번호와 참고자료 번호 맞추기.. 그래서 중복 레퍼런스도 허용
# 이때, 프롬프트에도 명확하게... 답변의 번호와 출처의 번호를 맞춰서 답변하시오..

def extract_sources(docs):
    # 숙제 요구사항: 답변 번호와 참고자료 번호를 맞추기 위해
    # 문서 순서대로 번호를 부여하고, 중복 source도 그대로 허용한다.
    numbered_sources = []
    for i, d in enumerate(docs, start=1):
        src = d.metadata.get("source", "N/A")
        numbered_sources.append({"idx": i, "source": src})
    return numbered_sources

def retrieve_and_split(inputs):
    docs = retriever.invoke(inputs["question"])
    return {
        "question": inputs["question"],
        "context": format_docs(docs),
        "sources": extract_sources(docs)
    }

def append_sources(d):
    src_lines = "\n".join(f"[{s['idx']}] {s['source']}" for s in d["sources"])
    return f"{d['answer']}\n\n참고문서 번호 매핑:\n{src_lines}"

chain = (
    RunnableLambda(retrieve_and_split)
    | RunnablePassthrough.assign(answer=(prompt | llm | StrOutputParser()))
    | RunnableLambda(append_sources)
)


# 4. 최종 질문
print(chain.invoke({"question": "NVMe 와 HBM의 차이는??"}))
