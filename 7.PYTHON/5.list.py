my_list = [1,2,3,4,5]


print(my_list)
print(len(my_list))

print(my_list[0]) #리스트의 첫 번째 요소에 접근

print(my_list[-1])

print(my_list[1:3]) #슬라이싱 리스트의 1번째 요소부터 3번째 요소까지(3은 미포함)
my_list.append(6) #리스트에 요소 추가
print("6이라는 요소 추가",my_list)

my_list.insert(2,99) #리스트의 2번째 인덱스에 99라는 요소를 추가
print("my_list.insert(2,99)",my_list)

my_list.pop()
print("my_list.pop()", my_list)

my_list.clear()
print("my_list.clear()", my_list)

my_list = [5,2,1,3,4,7,6,8,9]
print(my_list)

my_list.sort() #정렬을 하는데, 원본값을 변경하는 함수 sort()
print("my_list.sort()", my_list)


my_list = [5,2,1,3,4,7,6,8,9]
new_list = sorted(my_list) #정렬을 하는데, 원본값을 변경하지 않는 함수 sorted()
print("\n my_list", my_list)
print("sorted(my_list)", new_list)

copyed_list = my_list.copy() #리스트를 복사하는 함수 copy()
print("\n copyed_list", copyed_list)

copyed_list.sort(reverse=True) #내림차순으로 정렬하는 함수 sort()의 reverse 매개변수에 True를 전달
print("\n copyed_list.sort(reverse=True)", copyed_list)
print("my_list", my_list) #원본 리스트는 변경되지 않음

#리스트 컴프리헨션
print("-"*30)
numbers = [x for x in range(1, 10)] #1부터 9까지의 숫자를 포함하는 리스트 생성
print("numbers", numbers)

numbers = [x for x in range(5)] #0부터 4까지의 숫자를 포함하는 리스트 생성
print("numbers", numbers)

numbers = [x**2 for x in range(5)] #0부터 4까지의 숫자의 제곱을 포함하는 리스트 생성
print("numbers", numbers)

numbers = [x for x in range(1, 10) if x % 2 == 0] #1부터 9까지의 숫자 중 짝수만 포함하는 리스트 생성
print("1부터 9까지의 숫자 중 짝수만 포함하는 리스트", numbers)

list1 = [1,2,3]
list2 = [4,5,6]

list12 = list1 + list2 #리스트를 합치는 연산자 +
print("list1 + list2", list12)
print("list1 * 3", list1 * 3) #리스트를 반복하는 연산자 *













