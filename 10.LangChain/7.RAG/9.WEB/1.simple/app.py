from flask import Flask, request, jsonify, render_template





############
# Flask 
############
app = Flask(__name__)

@app.get('/')
def index():
    return render_template('index.html')

@app.post('/upload')
def upload():
    return jsonify({"message": "업로드 완료"})


@app.post('/ask')
def ask():
    return jsonify({"answer":"답변 완료"})

if __name__ == "__main__":
    app.run(debug=True)
    


















