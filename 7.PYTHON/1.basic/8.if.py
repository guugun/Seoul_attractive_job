print("--if구문--")

score = 80
if (score >=80):
    print("성적은 A+ 입니다.")

elif (score >= 70):
    print("성적은 B 입니다.")

elif (score >= 60):
    print("성적은 C 입니다.")

else:
    print("성적은 F 입니다.")

month = 7
if month in [3, 4, 5]:
    print("봄입니다.")

elif month in [6, 7, 8]:
    print("여름입니다.")

elif month in [9, 10, 11]:
    print("가을입니다.")

elif month in [12, 1, 2]:
    print("겨울입니다.")

username = "admin"
password = "1234"

if username == "admin" and password == "1234":
    print("로그인 성공")

else:
    print("로그인 실패")

if username == "admin" or password == "1234":
    print("관리자로 로그인 성공")































