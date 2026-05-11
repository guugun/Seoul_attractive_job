#딕셔너리
# 키:벨류로 쌍을 이루고 있는 자료구조
my_dict = {"name":"Alice", "age":25, "city":"New York"}

print(my_dict)
print(my_dict["name"])
print(my_dict["age"])
print(my_dict["city"])

my_dict["car"] = "Tesla" #딕셔너리에 새로운 키-값 쌍 추가
print(my_dict)

del my_dict["city"] #딕셔너리에서 키-값 쌍 삭제
print(my_dict)

my_age= my_dict.pop("age") #딕셔너리에서 키-값 쌍을 제거하고, 제거된 값 반환
print("my_age", my_age)
print(my_dict)

my_dict.clear() #딕셔너리의 모든 키-값 쌍 제거
print(my_dict)

my_squares = {x: x**2 for x in range(10)} #숫자와 그 제곱을 키-값 쌍으로 하는 딕셔너리
print(my_squares)

print(my_squares.keys()) #딕셔너리의 모든 키 반환
print(my_squares.values()) #딕셔너리의 모든 값 반환

































