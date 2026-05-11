numbers = [1, 2, 3, 4, 5]

for num in numbers:
    print(num)

    if num % 2 ==0:
        print(f"숫자 {num}은 짝수입니다.")

    else:
        print(f"숫자 {num}은 홀수입니다.")

even_numbers = []
odd_numbers = []

for num in numbers:
    if num % 2 == 0:
        even_numbers.append(num)

    else:
        odd_numbers.append(num)

print(f"짝수: {even_numbers}")
print(f"홀수: {odd_numbers}")

import time
n=100
count = 0

start = time.time()

for i in range(n):
    for j in range(n):
        count += 1

end = time.time()

exact_time = end - start
print("소요 시간: ", f"{exact_time:.1f}초")
print("합산: ", count)




























