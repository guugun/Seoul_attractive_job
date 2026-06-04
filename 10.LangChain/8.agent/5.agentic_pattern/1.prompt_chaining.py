# 질문

def run_chaining_pipeline(topic):
    # 1단계: 리서치
    print('[1단계] 리서치 수행중')
    research = research_chain.invoke({"topic": topic})

    print('[2단계] 게이트 검증 수행중')
    gate_result = gate_chain.invoke({"research": research})

    # 3단계: 분석 수행
    print('[3단계] 분석 수행중')
    analysis = analysis_chain.invoke({"research": research})

    # 4단계: 보고서 작성
    

    return analysis



# 1. 2026년도 생성형 AI 시장 동향 조사를 해오시오.

topic = "2026년도 생성형 AI 시장 동향 조사를 해오시오."

result = run_chaining_pipeline(topic)
print('-'*60)
print('최종 보고서:')

print('-'*60)
print(result)





































