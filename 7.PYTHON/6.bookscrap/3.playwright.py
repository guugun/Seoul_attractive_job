#pip install playwright #브라우저를 코드로 자동 조종하는 도구 설치
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    #크롬을 실행한다
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto("https://naver.com")
    print(page.title())

    page.screenshot(path="naver.png") #화면 캡쳐해서 naver.png로 저장
    input("엔터를 누르면 종료됩니다.")



    browser.close()











































