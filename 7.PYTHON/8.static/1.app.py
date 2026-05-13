from flask import Flask, render_template

app = Flask(__name__)

users = [
    {"id": 1, "name": "홍길동", "email": "hong@example.com"},
    {"id": 2, "name": "김철수", "email": "kim@example.com"},
    {"id": 3, "name": "이영희", "email": "lee@example.com"},
    {"id": 4, "name": "박민수", "email": "park@example.com"},
    {"id": 5, "name": "최지훈", "email": "choi@example.com"},
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/user')
def user():
    return send_from_






if __name__ == '__main__':
    app.run(debug=True)




























































