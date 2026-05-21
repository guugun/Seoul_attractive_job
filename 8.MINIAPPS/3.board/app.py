from flask import Flask, send_from_directory, request, jsonify
from database import MyDatabase

app = Flask(__name__)
db = MyDatabase()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/create', methods=['POST'])
def create():
    data = request.get_json()
    title = data.get('title')
    message = data.get('message')
    # print(title, message)

    sql = "INSERT INTO board (title, message) VALUES (?,?)"
    db.execute(sql, (title, message))
    db.commit()

    return jsonify({'result': 'success'})

@app.route('/list')
def list():
    sql = 'SELECT * FROM board'
    result = db.execute_fetch(sql)
    print(result)
    dict_list = [{'id': r['id'], 'title': r['title'], 'message': r['message']} for r in result]

    return jsonify(dict_list)

@app.route('/delete', methods=['POST'])
def delete():
    return jsonify({'result': 'success'})

@app.route('/modify', methods=['POST'])
def modify():
    return jsonify({'result': 'success'})


if __name__ == '__main__':
    app.run(debug=True)
