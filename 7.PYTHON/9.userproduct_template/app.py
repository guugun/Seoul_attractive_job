from flask import Flask, render_template, request

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
    return render_template('user.html', users=users)


@app.route('/user/<int:user_id>')
def user(user_id=None):
    user = next((u for u in users if u['id'] == user_id), None)
    if user:
        return render_template('user_detail.html', user=user)
    else:
        return "User not found", 404

if __name__ == '__main__':
    app.run(debug=True)

























