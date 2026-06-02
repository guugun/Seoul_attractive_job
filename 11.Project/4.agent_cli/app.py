# 금융 도우미 에이전트 챗봇 만들기

# 랭체인들을 불러온다

from fin_tools import TOOLS

SYSTEM="""
당신은 금융 정보 비서입니다. OOO OOO OOO 을 하는...
"""

def ask(q):
    # agent를 통해서 해당 질문을 호출한다.
    print('[질문]', q)
    return "미구현"

if __name__ == "__main__":
    print('=== 데모 명령어 실행 ===')
    for q in ["삼성전자 주가 알려줘", "달러 환율 얼마야?", "엔비디아 관련 최근 뉴스는 뭐가 있어?"]:
        ask(q)

    print('=== 수동 질의 응답 시작 ===')
    while True:
        # 사용자로부터 질문을 받아서 'q', 'quit', 'exit', 가 올때까지 반복한다.

        if not q or q.lower() in ("q", "quit", "exit"):
            break
