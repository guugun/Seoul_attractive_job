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


def create_user(session, name, age):
    new_user = User(name, age)
    session.add(new_user)
    session.commit()
    return new_user


def list_users(session):
    users =  session.query(User).all()
    return users

def get_user_by_id(session, user_id):

    return session.get(User, user_id)

def update_user_age(session, user_id, new_age):
    user = session.get(User, user_id)
    if not user:
        return None
    user.age = new_age
    session.commit()
    return user

def delete_user_by_id(session, user_id):
    user = session.get(User, user_id)
    if not user:
        return False
    session.delete(user)
    session.commit()
    return True

def delete_user_by_name(session, name):
    users = session.query(User).filter_by(name=name).all()

    if not users:
        return False
    
    for user in users:
        session.delete(user)
    session.commit()
    return True


if __name__ == "__main__":
    Session = sessionmaker(bind=engine)
    with Session() as session:
        hong = create_user(session, "홍길동", 22)
        kim = create_user(session, "김길동", 33)
        print(f"추가된 사용자들: " {hong.id}, {kim.id})

        user = get_user_by_id(session, hong.id)
        print(f"ID로 조회된 사용자: {user.id}, {user.name}")

        users = list_users(session)
        print("모든 사용자:")
        for u in users:
            print(f"{u.id}, {u.name}, {u.age}")

        updated_user = update_user_age(session, kim.id, 44)
        user = get_user_by_id(session, kim.id)
        





