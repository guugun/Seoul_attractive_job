from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

from sqlalchemy import Column, Integer, String

from sqlalchemy.orm import sessionmaker 

engine = create_engine('sqlite:///example.db')

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    age = Column(Integer)


Base.metadata.create_all(engine)


# 활용
Session = sessionmaker(bind=engine)
session = Session()

new_user = User(name="홍길동", age=25)

session.add(new_user)
session.commit()

print('-',*30)
users = session.query(User).all()

for user in users:
    print(user.name, user.age)

print('-',*30)
















