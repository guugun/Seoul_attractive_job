students = {
    "윤태호":73,
    "김민수":85,
    "박지성":92,
    "이영희":78,
    "최민호":88,
    "김영희":95,
    "박민수":80,
    "김태호":82,
    "이민수":90,
    "최영희":87
}

print(students)

def get_a_student(students):
    a_students = []
    for name, score in students.items():
        if score >= 90:
            a_students.append(name)
    return a_students

print("A등급 학생: ",get_a_student(students))














































