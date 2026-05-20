from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__='users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    age = db.Column(db.Integer, nullable=False)


    def __repr__(self):
        return f"<User {self.id} {self.name} ({self.age})>"

app = Flask(__name__)
app.config['SECRET_KEY'] = 'my-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///example.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# 우리의 DB와 flask 앱을 연결
db.init_app(app)

@app.route('/')
def index():
    users = User.query.all()
    for user in users:
        print(user)

    return render_template('index.html', users=users)

if __name__ == '__main__':
    with app.app_context():

        print('DB 초기화중...')
        db.create_all()

        if not User.query.first():
            print('사용자 초기화')
            





















































