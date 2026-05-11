print('**')
print('***')
print('****')
print('*****')

print('\n - 1 -')

for i in range(1, 6): # range(1, 6)은 1부터 5까지의 숫자를 생성하는 함수.6은 미포함
    print("*" * i)

print("=" * 20)
print("=      성적표      =")
print("=" * 20)

print('\n - 2 -')
n = 5
for i in range(1, 6): # 오른쪽 정렬된 삼각형
    print(" " * (n-i) + "*" * i)

print('\n - 3 -')


for i in range(1, 6): # 이등변 삼각형
    print(" " * (n-i) + "*" * (i*2-1))



