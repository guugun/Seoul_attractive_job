from flask import Flask, send_from_directory, ...
from database import MyDatabase

app = Flask(__name__)
db = MyDatabase()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/create', methods=['POST'])
def create():
    sql = "INSERT INTO board ..... (?,?)"

    db.execute(sql, (title, message))
    
    return jsonify({'result': 'success'})

@app.route('/list')
def list():
    return jsonify({'result': 'success'})

@app.route('/delete', methods=['POST'])
def delete():
    return jsonify({'result': 'success'})

@app.route('/modify', methods=['POST'])
def modify():
    return jsonify({'result': 'success'})


if __name__ == '__main__':
    app.run(debug=True)
