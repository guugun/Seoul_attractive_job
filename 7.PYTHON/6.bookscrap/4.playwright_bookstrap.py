#pip install playwright #브라우저를 코드로 자동 조종하는 도구 설치
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    #크롬을 실행한다
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto("https://books.toscrape.com")

    books = page.locator("article.product_pod") #css 선택자 이용해서 article태그중에 class가 product_pod인것만 선택
    print(books.count()) #북 개수는 20개임. 20개의 책이 담긴 리스트가 나옴




    # print(page.title())
    # page.screenshot(path="books.png") #화면 캡쳐해서 books.png로 저장
    # input("엔터를 누르면 종료됩니다.")



    browser.close()











































