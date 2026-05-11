def add_numbers(a, b):
    """파이썬 주석은 일반적으로 함수 바로 안에들어온 이 위치에 작성한다. 따옴표 3개로."""
    result = a + b
    return result

sum = add_numbers(5, 3)
print("두 수의 합은 :", sum)


def add_numbers2(a,b):
    return a, b, a+b

input1, input2, sum = add_numbers2(3, 4)
print(f"인자값 1은 {input1} 이고, 인자값 2는 {input2} 이며, 두 수의 합은 {sum}")

def calculate_all(a,b):
    addition = a+ b
    subtraction = a - b
    multiplication = a * b
    division = a / b

    return addition, subtraction, multiplication, division

add, sub, mul, div = calculate_all(3, 4)
print(f"덧셈: {add}, 뺄셈: {sub}, 곱셈: {mul}, 나눗셈: {div}")

print('-'*30)

def create_profile(name, age, city="서울", job="개발자"):
    profile = f"이름: {name}, 나이: {age}, 지역: {city}, 직업: {job}"
    return profile

print(create_profile("홍길동", 25))
print(create_profile("김철수", 27))
print(create_profile("이영희", 28))




































