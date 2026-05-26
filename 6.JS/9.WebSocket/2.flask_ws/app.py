#pip install flask-sock
from flask import Flask, send_from_directory
from flask_sock import Sock

app = Flask(__name__)
sock = Sock(app)

@app.route("/")
def index():
    return send_from_directory('static', 'index.html')



@sock.route("/ws")
def websocket(ws):
    print("클라이언트가 웹소켓에 연결되었습니다.")
    ws.send("웹소켓 서버에 연결되었습니다!")

    while True:
        try:
            message = ws.receive()
            print("클라이언트로부터 받은 메시지: ", message)

            ws.send(f"이번에도 이전처럼 메시지 돌려주기: {message}")
        except Exception as e:
            print("에러 발생: ", e)
            break


if __name__ == "__main__":
    app.run(debug=True)








