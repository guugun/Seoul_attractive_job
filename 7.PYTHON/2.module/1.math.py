import math

print(math.pi) 
print(math.e)
print(math.sqrt(16))

print(math.ceil(3.2)) # 올림
print(math.floor(3.8)) # 내림


import datetime as dt
print(dt.datetime.now())# 클래스명.객체명.메소드명()
print(dt.datetime.now().strftime("%Y-%m-%d")) # strftime()는 날짜와 시간을 문자열로 포맷팅하는 메소드입니다. "%Y-%m-%d"는 연도-월-일 형식으로 날짜를 출력하도록 지정하는 포맷 문자열입니다. 예를 들어, 2024년 6월 15일이라면 "2024-06-15"와 같이 출력됩니다.
print(dt.datetime.now().strftime("%H:%M:%S")) # "%H:%M:%S"는 시간-분-초 형식으로 시간을 출력하도록 지정하는 포맷 문자열입니다. 예를 들어, 오후 3시 45분 30초라면 "15:45:30"과 같이 출력됩니다.

a_day = dt.datetime(2025, 1, 1, 10, 00, 0)
print(a_day)


import random

print(random.random()) # 0.0 이상 1.0 미만의 임의의 부동 소수점 숫자를 반환합니다.
print(math.floor(random.random() * 100)) # 0부터 99까지의 임의의 정수를 반환합니다. random.random()은 0.0 이상 1.0 미만의 임의의 부동 소수점 숫자를 반환하므로, 여기에 100을 곱하면 0.0 이상 100.0 미만의 숫자가 됩니다. math.floor()는 이 숫자를 내림하여 정수로 만듭니다.
print(random.randint(1, 100)) # 1부터 100까지의 임의의 정수를 반환합니다. random.randint(a, b)는 a 이상 b 이하의 임의의 정수를 반환하는 함수입니다. 따라서 random.randint(1, 100)은 1부터 100까지의 정수 중에서 무작위로 하나를 선택하여 반환합니다.


def roll_dice():
    my_number = random.randint(1, 6)
    return my_number

print("내 주사위의 숫자는 : ",roll_dice())
print("내 주사위의 숫자는 : ",roll_dice())
print("내 주사위의 숫자는 : ",roll_dice())
print("내 주사위의 숫자는 : ",roll_dice())
print("내 주사위의 숫자는 : ",roll_dice())
print("내 주사위의 숫자는 : ",roll_dice())

fruits =['apple','banana','cherry','grape','orange','pineapple']

def pick_fruit():
    """앞에서 배운 randint로 리스트에서 랜덤과일을 반납하도록 직접구현"""
    my_number = random.randint(0, len(fruits) -1)
    my_pick = fruits[my_number]
    return my_pick

def pick_fruit2():
    """모듈안에 있는 함수를 이용해서 리스트에서 랜덤과일을 반납하도록 직접구현"""
    return random.choice(fruits) # random.choice()는 주어진 시퀀스에서 임의의 요소를 선택하여 반환하는 함수입니다. fruits 리스트에서 무작위로 하나의 과일을 선택하여 반환합니다.


print("내가 고른 과일은 : ",pick_fruit())
print("내가 고른 과일은 : ",pick_fruit())
print("내가 고른 과일은 : ",pick_fruit())
print("내가 고른 과일은 : ",pick_fruit())

print("내가 고른 과일은2 : ",pick_fruit2())
print("내가 고른 과일은2 : ",pick_fruit2())
print("내가 고른 과일은2 : ",pick_fruit2())
print("내가 고른 과일은 : ",pick_fruit2())

























