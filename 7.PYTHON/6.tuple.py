#튜플 : #리스트와 거의 비슷하지만, 한번 생성된 튜플은 변경이 불가능하다. 
#읽기전용 리스트라 생각하기

my_list = [1,2,3]
my_tuple = (1,2,3)

print("my_list[2]", my_list[2])
print("my_tuple[2]", my_tuple[2])

my_list[2] = 99 #리스트는 변경이 가능하다. 따라서 my_list[2]의 값이 4로 변경된다.
#my_tuple[2] = 99 #튜플은 변경이 불가능하다. 따라서 my_tuple[2]의 값이 변경되지 않고, 오류가 발생한다.

print("my_list[-1]", my_list[-1])
print("my_tuple[-1]", my_tuple[-1])


my_newlist = tuple(my_list) #리스트를 튜플로 변환하는 함수 tuple()
print("my_newlist", my_newlist)

my_newtuple = list(my_tuple) #튜플을 리스트로 변환하는 함수 list()
print("my_newtuple", my_newtuple)

print("my_tuple가 변경됫는지 여부확인", my_tuple) #my_tuple은 변경되지 않았다. 따라서 (1,2,3)이 출력된다.

a_person = ("John",23,"Student")
print("a_person", a_person)

name, age, job = a_person #튜플 언패킹. 튜플의 요소들을 각각의 변수에 할당하는 방법
print("name", name)
print("age", age)
print("job", job)


































