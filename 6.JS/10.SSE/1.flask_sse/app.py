#별도의 라이브러리없이 그냥 Flask에 있는 REsponse라는걸 통해서.. stream event를 줄 수 있다
from flask import Flask, send_from_directory
from flask import request, Response
from queue import Queue


app = Flask(__name__)

#연결된 사용자들 관리
clients = []


@app.route("/")
def index():
    return send_from_directory('static', 'index.html')


#클라이언트에서 응답을 보낼 API - SSE방식으로 보낼 API, 상대방이 여기를 바라보고
#있으면, 내가 여기를 통해서 메시지를 보낼때마다, 클라에게 전달됨 =event-stream
#이라고 함
@app.route("/stream")
def stream():
    print("클라이언트 연결됨 - 누가 이 API를 듣고 있음")

    def event_stream():
        q = Queue()
        clients.append(q) #연결된 사용자들 관리하는 리스트에 큐 추가
                #응답을 보낼 사용자 목록에 이 새로온 사용자를 추가
        try:
            yield f"data: 서버에 연결되었습니다!\n\n"
            # 보낼때 data: <메시지>\n\n"
            while True:
                message = q.get() #큐에서 메시지 꺼내기
                if message is None: #메시지가 None이면, 연결 끊긴거니까, 루프 탈출
                    break
                yield f"data: {message}\n\n" #메시지 보낼때마다, 클라에게 전달

        except GeneratorExit:
            print("클라이언트 연결 끊김")

        finally:
            clients.remove(q) #연결 끊긴 사용자 큐 제거

    return Response(event_stream(), mimetype="text/event-stream")



#클라이언트가 나에게 보내는 API
@app.route("/send", methods=["POST"])
def send():
    message = request.form.get("message","")
    print("클라이언트로부터 받은 메시지: ", message)
    for q in clients:
        q.put(f"서버가 받은 메시지: {message}")
    return ("", 204)


if __name__ == "__main__":
    app.run(debug=True)
































