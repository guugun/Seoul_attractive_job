async function loadList() {
    const res = await fetch('/list');
    const data = await res.json();
    console.log(data);
    const cardList = document.getElementById('card-list');
    cardList.innerHTML = '';
    data.forEach(post => {
        makeCard(post.id, post.title, post.message);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadList();
});

document.getElementById('btn-list').addEventListener('click', () => {
    loadList();
});

function makeCard(id, title, message) {
    const card = document.createElement('div');
    card.innerHTML = `
    <div>
        <div class="card-body">
            <p>${id}</p>
            <p>${title}</p>
            <p>${message}</p>
            <button class="btn-modify">수정</button>
            <button class="btn-delete">삭제</button>
        </div>
    </div>
    `;

    card.querySelector('.btn-delete').addEventListener('click', () => {
        fetch('/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        }).then(() => loadList());
    });

    card.querySelector('.btn-modify').addEventListener('click', () => {
        const newTitle = prompt('새 제목을 입력하세요', title);
        if (newTitle === null) return;
        const newMessage = prompt('새 내용을 입력하세요', message);
        if (newMessage === null) return;

        fetch('/modify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id, title: newTitle, message: newMessage })
        }).then(() => loadList());
    });

    document.getElementById('card-list').appendChild(card);
}

document.getElementById('input-submit').addEventListener('click', () => {
    const title = document.getElementById('input-title').value;
    const message = document.getElementById('input-text').value;

    fetch('/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ title, message })
    }).then(() => {
        document.getElementById('input-title').value = '';
        document.getElementById('input-text').value = '';
        loadList();
    });
})
