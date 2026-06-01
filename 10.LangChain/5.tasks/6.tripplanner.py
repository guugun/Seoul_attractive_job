# 목적 - 여행 계획을 작성한다.
# 도시 입력 -> 음식 추천
#          -> 관광지 추천
#          -> 호텔 추천
# 사용자 입력의 OO을 보고, 시간표/동선/교통수단 vs 음식/관광지/호텔
# RunnableParallel, RunnableBranch

from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from langchain_core.runnables import RunnableParallel, RunnableBranch, RunnableLambda

load_dotenv()

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)


# 하나의 역할(role)을 받아서 chain을 만들어주는 함수
def make_chain(role):
    return (
        ChatPromptTemplate.from_messages(
            [("system", role), ("user", "여행 도시: {city}\n\n요청: {question}")]
        )
        | llm
        | StrOutputParser()
    )


# ---------------------------------------------------------------
# 1) 추천 파트 - 음식/관광지/호텔을 "동시에" 추천 (RunnableParallel)
# ---------------------------------------------------------------
food_chain = make_chain(
    "당신은 맛집 전문가입니다. 입력된 도시의 대표 음식과 추천 맛집 3곳을 간단히 알려주세요."
)
sightseeing_chain = make_chain(
    "당신은 여행 가이드입니다. 입력된 도시의 추천 관광지 3곳을 간단히 알려주세요."
)
hotel_chain = make_chain(
    "당신은 호텔 컨시어지입니다. 입력된 도시의 가격대별 추천 호텔 3곳을 간단히 알려주세요."
)

recommend_chain = RunnableParallel(
    {
        "food": food_chain,
        "sightseeing": sightseeing_chain,
        "hotel": hotel_chain,
    }
)

# 추천 결과(dict)를 보기 좋은 문자열로 합쳐주는 단계
recommend_chain = recommend_chain | RunnableLambda(
    lambda x: (
        f"[음식 추천]\n{x['food']}\n\n"
        f"[관광지 추천]\n{x['sightseeing']}\n\n"
        f"[호텔 추천]\n{x['hotel']}"
    )
)


# ---------------------------------------------------------------
# 2) 일정 파트 - 시간표/동선/교통수단 계획 (단일 chain)
# ---------------------------------------------------------------
itinerary_chain = make_chain(
    "당신은 여행 일정 플래너입니다. 입력된 도시의 하루 여행 일정을 "
    "시간표, 동선, 교통수단을 포함해서 표 형태로 자세히 작성해주세요."
)


# ---------------------------------------------------------------
# 3) 분기 - 사용자 요청을 보고 '일정' vs '추천' 선택 (RunnableBranch)
# ---------------------------------------------------------------
branch = RunnableBranch(
    # 질문에 일정/동선/교통 관련 키워드가 있으면 -> 일정 플래너
    (
        lambda x: any(
            k in x["question"]
            for k in ["일정", "동선", "시간표", "교통", "코스", "스케줄"]
        ),
        itinerary_chain,
    ),
    # 그 외에는 -> 음식/관광지/호텔 추천 (병렬)
    recommend_chain,
)


# ---------------------------------------------------------------
# 4) 실행
# ---------------------------------------------------------------
requests = [
    {"city": "부산", "question": "여행 가서 먹고 보고 잘 곳 추천해줘"},
    {"city": "서울", "question": "하루 동안 효율적인 일정과 동선, 교통수단 짜줘"},
]

for req in requests:
    print("=" * 60)
    print(f"도시: {req['city']} / 요청: {req['question']}")
    print("-" * 60)
    print(branch.invoke(req))
    print()
