from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto("https://news.naver.com/section/105")       # IT/과학 뉴스 페이지 접속
    
    headlines = page.locator(".section_article.as_headline a.sa_text_title")
    print("헤드라인 갯수: ", headlines.count())

    for i in range(headlines.count()):  
        news = headlines.nth(i)

        title = news.inner_text().strip()  # 제목 텍스트 추출

        link = news.get_attribute("href")   # 링크 추출

        print(f"{i+1}. {title}\n  {link}\n")
    
    input("엔터를 누르면 종료됩니다.")
    
    
    # page.wait_for_selector("a.sa_text_t")                 # 기사 제목 링크가 뜰 때까지 대기

    # titles = page.query_selector_all("a.sa_text_t")       # 기사 제목 링크 전부 가져오기

    # for i, title in enumerate(titles, 1):                 # 번호 붙여서 반복
    #     print(i, title.inner_text())                      # 제목 텍스트 출력

    browser.close()




































