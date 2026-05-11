print("Hello, World!") #따옴표인지 쌍따옴표로 할지는 회사마다
                        # 룰이다르므로 회사에서 정한 룰에 맞춰서 작성하면 된다.
print('Hello, World!') #따옴표로 작성한 경우

print("Hello," + "World!") #쌍따옴표로 작성한 경우


num = 5
#int num = 5 #파이썬에서는 변수 선언 시 자료형을 명시하지 않는다. 따라서 int는 제거해야 한다.
#지금 시대에는 갈수록 하이레벨 언어를 추구함. 그래서 자료형 명시하는 것을 지양하는 추세이다.
name = "홍길동"
print("Hello, {}".format(name))
print("hello, {0}. My Lucky number is {1}".format(name, num)) #format 메서드를 사용하여 문자열에 변수를 삽입할 수 있다.
print("hello, {1}. My Lucky number is {0}".format(name, num)) 

print("Hello, %s" % name) #%s는 문자열을 의미한다. %d는 정수를 의미한다. %f는 실수를 의미한다.
print("Hello, %s" % name, end="")
print("홍길동", end="")
print("홍길동", end="++")
print("==========")
print(f"{10:>5}")
print(f"{10:<5}")
print(f"{10:^5}")

multiline = """
이걸 주석이라고 배웠을텐데, 사실은 주석이 아니고 여러줄의 문자열입니다.
"""

print(multiline)







