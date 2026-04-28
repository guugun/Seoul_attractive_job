// 각자의 버튼이 눌릴때마다 위에 div의 값을 가져다가 +1 또는 -1 을 한다.
const button1 = document.getElementById('incButton');
const button2 = document.getElementById('decButton');

/* 이벤트 핸들러 */
button1.addEventListener('click', () => {
    document.getElementById('result').textContent = parseInt(result.textContent) + 1;
});

button2.addEventListener('click', () => {
    document.getElementById('result').textContent -= 1;
});
