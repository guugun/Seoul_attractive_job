# pip install faiss-cpu

from dotenv import load_dotenv
import os

from openai import OpenAI

import faiss
import numpy as np

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

#우리의 문장 데이터
documents = [
    "한국소프트웨어 저작권협회는 SPC라는 약자를 가지고 있고, 다양한 국내 기업의 "
    "SW라이선스와 저작권을 다루는 곳입니다.",
    "홍길동은 2020년 1월 1일 생으로, 강원도 설빙산에서 태어났고, 그곳에서 호랑이를 잡아먹으며 성장하였습니다."




]
def get_embedding(text):
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    print("임베딩 결과: ", response)
    return np.array(response.data[0].embedding)

# print(get_embedding(documents))

index = faiss.IndexFlatL2(1536)  # 1536 차원의 벡터를 저장할 수 있는 인덱스 생성

doc_embeddings = np.array([get_embedding(doc) for doc in documents])

#사용자의 질문을 받아서 우리의 벡터DB에 물어본다'

def rag_query(user_query):
    query_embedding = get_embedding(user_query)
    _, indices = index.search(np.array([query_embedding]), k=1)  # 가장 유사한 문장 

    retrieved_doc = documents[indices[0][0]]

    print(">>>>>>")
    print("")
    print("")
    prompt = """
        아래 내용을 보고 답변하세요.
        사용자의 질문: {user_query}
        관련된 자료: {retrieved_doc}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "당신은 친절한 AI도우미 입니다."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content
    print(indices)
    
    
query = "홍길동은 누구인가요?"

rag_query(query)





















