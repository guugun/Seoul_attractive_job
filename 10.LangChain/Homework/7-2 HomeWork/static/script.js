// 일단 DOM이 로딩 된 다음에...
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('user-input');
    const formInput = document.getElementById('user-input-form');
    const resultDiv = document.getElementById('result');
    const chatContainer = document.getElementById('chat-container');
    const historyList = document.getElementById('history-list');

    // 페이지가 열리면 서버에 저장된 기존 대화를 먼저 불러온다
    loadHistory();

    // 폼 제출 이벤트 리스너
    formInput.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        const chatMessage = chatInput.value.trim();
        if (!chatMessage) return; // 빈 메시지는 전송 안 함

        // 1. 내가 보낸 메시지를 먼저 화면(우측)에 추가
        appendMessage('user', chatMessage);
        appendHistoryItem(chatMessage); // 왼쪽 사이드바에도 질문 추가
        chatInput.value = ''; // 입력창 비우기

        try {
            // 2. 백엔드 API에 메시지 전송
            const replyText = await fetchChatbotReply(chatMessage);

            // 3. 챗봇의 답변을 화면(좌측)에 추가
            appendMessage('bot', replyText);
        } catch (error) {
            console.error('에러 발생:', error);
            appendMessage('bot', '죄송해요, 서버와 연결이 원활하지 않아요. 😢');
        }
    });

    /**
     * 서버에 저장된 기존 대화내역을 불러와서 화면에 다시 그려주는 함수
     */
    async function loadHistory() {
        try {
            const response = await fetch('/api/history');
            if (!response.ok) return; // 실패 시 그냥 빈 화면 유지

            const data = await response.json();
            data.messages.forEach((msg) => {
                appendMessage(msg.sender, msg.text);        // 채팅창에 복원
                if (msg.sender === 'user') {
                    appendHistoryItem(msg.text);            // 사이드바에 질문 복원
                }
            });
        } catch (error) {
            console.error('히스토리 불러오기 실패:', error);
        }
    }

    /**
     * API 통신을 담당하는 함수 (Fetch 분리)
     */
    async function fetchChatbotReply(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chatMessage: message })
        });

        // 로그인이 풀린 경우(401) -> 로그인 페이지로 보냄
        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('로그인이 필요합니다.');
        }

        if (!response.ok) {
            throw new Error('네트워크 응답에 문제가 있습니다.');
        }

        const data = await response.json();
        return data.reply;
    }

    /**
     * 화면에 말풍선 DOM을 그리는 함수 (그리기 분리)
     * @param {string} sender - 'user' 또는 'bot'
     * @param {string} text - 메시지 내용
     */
    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('bubble');
        bubbleDiv.innerText = text;

        messageDiv.appendChild(bubbleDiv);
        resultDiv.appendChild(messageDiv);

        // 메시지가 쌓였을 때 자동으로 스크롤을 맨 아래로 내려줌
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * 왼쪽 사이드바에 내가 한 질문을 한 줄씩 추가하는 함수
     * @param {string} text - 질문 내용
     */
    function appendHistoryItem(text) {
        const li = document.createElement('li');
        li.classList.add('history-item');
        li.innerText = text;
        li.title = text; // 길면 마우스 올렸을 때 전체 보이도록
        historyList.appendChild(li);
    }
});
