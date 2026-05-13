# pip install flask
from flask import Flask, render_template

app = Flask(__name__)

users = [
    {'name': '홍길동', 'age': 25, 'phone': '123-456-7890'},
    {'name': '고길동', 'age': 30, 'phone': '123-555-7890'},
    {'name': '김길동', 'age': 27, 'phone': '123-777-7890'},
    {'name': '이길동', 'age': 25, 'phone': '123-767-7890'}
]
@app.route('/')
def index():
    # user_names = ["홍길동","고길동","김길동","이길동"]
    final_html = render_template("users_detail.html", users=users)# templates 폴더 안에 있는 index.html 파일을 찾아서 웹페이지로 보여줘
    print("final_html: ", final_html)
    return final_html



if __name__ == '__main__':
    app.run(debug=True)









































