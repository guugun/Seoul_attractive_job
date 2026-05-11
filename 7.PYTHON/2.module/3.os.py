import os 

print(os.getcwd()) # 현재 작업 디렉토리를 반환하는 함수입니다. 현재 작업 디렉토리는 프로그램이 실행되는 위치를 나타냅니다.
print(os.mkdir("Hello")) # 현재 작업 디렉토리에 "Hello"라는 이름의 새 디렉토리를 생성하는 함수입니다. 이미 "Hello"라는 디렉토리가 존재하면 FileExistsError가 발생합니다.


os.chdir("C:\Users\NT551XED\Desktop\Donggun")

cwd = os.getcwd() # 현재 작업 디렉토리를 반환하는 함수입니다. 현재 작업 디렉토리는 프로그램이 실행되는 위치를 나타냅니다.
print(cwd)








































