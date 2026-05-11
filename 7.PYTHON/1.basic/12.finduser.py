users = [
    {"name": "김민준", "age": 28, "location": "서울", "car": "현대 아반떼"},
    {"name": "이서연", "age": 34, "location": "부산", "car": "기아 K5"},
    {"name": "박지훈", "age": 22, "location": "인천", "car": "토요타 캠리"},
    {"name": "최수아", "age": 41, "location": "대구", "car": "BMW 3시리즈"},
    {"name": "정도윤", "age": 19, "location": "광주", "car": "없음"},
    {"name": "한예진", "age": 55, "location": "대전", "car": "벤츠 E클래스"},
    {"name": "오준호", "age": 30, "location": "울산", "car": "현대 싼타페"},
    {"name": "신미래", "age": 27, "location": "수원", "car": "테슬라 모델3"},
    {"name": "임태양", "age": 38, "location": "성남", "car": "기아 카니발"},
    {"name": "강하늘", "age": 45, "location": "창원", "car": "폭스바겐 골프"},
]

def find_user(name):
    for user in users:
        if user["name"].startswith(name):
            print(user)

find_user("오")

def find_user_and_return(name):
    found = []
    for user in users:
        if user["name"].startswith(name):
            found.append(user)
    return found

found_users = find_user_and_return("신")
print("찾은 사용자", found_users)

# def find_users2(name=None, age=None):
#     """이름 또는 나이를 입력받아 매칭되는 사람을 반환한다"""
#     for user in users:
#         if name is not None and age is not None:
#             if user["name"] == name and user["age"] == age:
#                 found.append(user)
#                 return user

# print(find_users2("김민준"))
# print(find_users2("김민준", 24))
# print(find_users2("김민준", 25))

# print(find_users2(25))

print("-"*30)
def find_users2_better(name=None, age=None):
    """이름 또는 나이를 입력받아 매칭되는 사람을 반환한다"""
    found = []
    for user in users:
        if (name is None or user["name"] == name) and (age is None or user["age"] == age):
            found.append(user)

    return found

print(find_users2_better("김민준"))

def find_users2_best(condition):
    """조건에 맞는 사람을 반환한다"""
    found = []
    for user in users:
        if user.get("name") == condition.get("name", user["name"]) and user.get("age") == condition.get("age", user["age"]):
            found.append(user)
    return found