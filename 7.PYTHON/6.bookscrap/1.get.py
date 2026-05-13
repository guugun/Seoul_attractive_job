# 1.books. toscrap.com에 접속해서 페이지를 받아온다
# 2. dom을 bs4로 구성한다.
# 3. 첫 페이지의 도서명, 평점, 가격을 받아온다
# 4. csv파일로 저장한다.
import requests 
from bs4 import BeautifulSoup

url = "http://books.toscrape.com/"
resp = requests.get(url)

print(resp.text)

soup = BeautifulSoup(resp.text, "html.parser")

print(soup)
# books = soup.find_all("article")
books = soup.select("article.product_pod") # css 선택자 이용해서 article태그중에 class가 product_pod인것만 선택 
print(len(books))  #북 개수는 20개임. 20개의 책이 담긴 리스트가 나옴
#===========

for book in books: #전체 책 중에서 한권씩 꺼내서
    #도서명
    title = book.h3.a["title"]
    print(title)

    #평점
    rating = book.p["class"][1]
    print(rating)

    #가격
    price = book.select_one(".price_color").text # css 선택자 이용해서 p태그중에 class가 price_color인것만 선택
    print(price)

#첫번째 책의 제목 출력
title = books[0].h3.a["title"]
print("\n도서명:",title)

# #첫번째 책의 평점 출력
rating = books[0].p["class"][1]
print("첫번째 책의 평점:", rating)


#첫번째 책의 가격 출력
price = books[0].select_one(".price_color").text
print("첫번째 책의 가격:", price)

























