#우리가 하고 싶은것: 서버에서 바뀌는 데이터를 알아서 변환한다.
# 아래처럼 함수를 부르면 1을 줬다가...2가

# def test():
#     return 1

# x = test()

# print(x)

def test():
    print("A") #이 함수가 수행할 다양한 일 
    yield 1 # 여기에서 일단 멈춤

    print("B") #이 함수가 수행할 그 다음 다양한 일들
    yield 2 # 여기에서 일단 멈춤(return2)

    print("C")
    yield 3

x = test() # generator 라는것이 만들어짐 - 동적으로 바뀌는 데이터를 전달하는 객체

print(next(x))
print(next(x))
print(next(x))




















