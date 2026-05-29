# 목적 - 뉴스를 분석한다.
# 뉴스 입력 -> 요약 
#          -> 감정분석 
#          -> 카테고리 분석
# RunnableParallel

from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnableParallel

load_dotenv()

llm = ChatOpenAI(model="gpt-4o-mini")

# ── 1. 요약 chain ──────────────────────────────────────
prompt_summary = ChatPromptTemplate.from_messages([
    ("system", "당신은 전문 뉴스 요약가입니다."),
    ("human", "다음 뉴스를 3문장 이내로 간결하게 요약하세요:\n\n{news}")
])
chain_summary = prompt_summary | llm | RunnableLambda(lambda x: x.content.strip())

# ── 2. 감정분석 chain ──────────────────────────────────
prompt_sentiment = ChatPromptTemplate.from_messages([
    ("system", "당신은 뉴스 감정 분석 전문가입니다."),
    ("human", "다음 뉴스의 감정을 분석하세요. '긍정', '부정', '중립' 중 하나와 이유를 한 문장으로 설명하세요:\n\n{news}")
])
chain_sentiment = prompt_sentiment | llm | RunnableLambda(lambda x: x.content.strip())

# ── 3. 카테고리 분석 chain ─────────────────────────────
prompt_category = ChatPromptTemplate.from_messages([
    ("system", "당신은 뉴스 카테고리 분류 전문가입니다."),
    ("human", "다음 뉴스의 카테고리를 분류하세요. (예: 정치, 경제, 사회, 문화, IT/과학, 스포츠, 국제 중 하나)\n\n{news}")
])
chain_category = prompt_category | llm | RunnableLambda(lambda x: x.content.strip())

# ── RunnableParallel로 동시에 3가지 분석 ──────────────
parallel_chain = RunnableParallel({
    "요약":     chain_summary,
    "감정분석": chain_sentiment,
    "카테고리": chain_category,
})

# ── 분석할 뉴스 입력 ────────────────────────────────────
news_text = (
    "삼성전자가 차세대 AI 반도체 개발에 대규모 투자를 단행한다고 밝혔다. "
    "회사 측은 2026년까지 총 20조 원을 투입해 HBM4 메모리와 AI 가속기 칩을 양산할 계획이라고 전했다. "
    "이번 투자는 엔비디아, AMD 등 글로벌 AI 반도체 업체들과의 경쟁에서 우위를 점하기 위한 전략으로 풀이된다."
)

result = parallel_chain.invoke({"news": news_text})

print("=" * 60)
print("📰 원문 뉴스:")
print(news_text)
print("=" * 60)
print("📝 요약:", result["요약"])
print("-" * 60)
print("😊 감정분석:", result["감정분석"])
print("-" * 60)
print("🏷️  카테고리:", result["카테고리"])
print("=" * 60)
