import sqlite3

class MyDatabase():
    def __init__(self):
        self.db = sqlite3.connect('board.sqlite', check_same_thread=False)
        self.cursor = self.db.cursor()

    def execute(self, query, args={}):
        self.cursor.execute(query, args)

    def execute_fetch(self, query, args={}):
        self.cursor.execute(query, args)
        result = self.cursor.fetchall()
        return result
    
    def commit(self):
        self.db.commit()
