(function () {
  let currentMusicId = null;

  const musicDetail = {
    async render(params) {
      const container = document.getElementById('app-content');
      if (!container) return;

      const musicId = parseInt(params.get('id'));
      if (isNaN(musicId)) {
        container.innerHTML = `<div class="container mt-5"><div class="empty-state"><h3>유효하지 않은 음악 ID입니다.</h3></div></div>`;
        return;
      }

      currentMusicId = musicId;

      container.innerHTML = `
        <div class="container fade-in">
          <div class="grid-detail mt-4">
            <!-- Left Panel: Video & Description -->
            <div class="detail-main">
              <div class="video-container card">
                <div class="video-wrapper">
                  <iframe 
                    id="youtube-player"
                    src="" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                  </iframe>
                </div>
              </div>

              <div class="music-info-card card mt-4">
                <div class="music-header-row">
                  <div>
                    <h1 id="music-title" class="music-detail-title">로딩 중...</h1>
                    <p id="music-channel" class="music-detail-channel"></p>
                  </div>
                  <button id="music-like-btn" class="btn btn-like-large">
                    <span class="heart-icon">🤍</span>
                    <span id="music-like-count">0</span>
                  </button>
                </div>

                <div class="hashtag-section mt-3">
                  <div id="hashtag-list" class="hashtag-container"></div>
                  
                  <div class="add-hashtag-form mt-3 logged-in hidden">
                    <input type="text" id="new-hashtag-input" placeholder="해시태그 추가 (쉼표로 구분, 예: 신나는, 힐링)...">
                    <button id="add-hashtag-btn" class="btn btn-primary btn-sm">추가</button>
                  </div>
                </div>

                <div class="description-section mt-4">
                  <h4>상세 설명</h4>
                  <p id="music-description" class="music-detail-desc"></p>
                </div>
              </div>
            </div>

            <!-- Right Panel: Comments & SNS -->
            <div class="detail-sidebar card">
              <div class="sidebar-header">
                <h3>의견 교환 (댓글)</h3>
              </div>
              
              <!-- Comment Input Form -->
              <div class="comment-input-area border-bottom">
                <div class="logged-in hidden">
                  <form id="comment-form">
                    <textarea id="comment-text" placeholder="이 음악에 대한 느낌이나 정보, 추천 이유를 댓글로 남겨보세요..." required></textarea>
                    <div class="text-right mt-2">
                      <button type="submit" class="btn btn-primary btn-sm">등록</button>
                    </div>
                  </form>
                </div>
                <div class="logged-out text-center py-3">
                  <p class="text-muted">댓글을 작성하려면 로그인이 필요합니다.</p>
                  <button class="btn btn-primary btn-sm mt-2" onclick="window.auth.showAuthModal('login')">로그인</button>
                </div>
              </div>

              <!-- Comment List -->
              <div id="comments-container" class="comments-list">
                <!-- Comments rendered here -->
                <div class="text-center py-4">댓글 불러오는 중...</div>
              </div>
            </div>
          </div>
        </div>
      `;

      await this.loadMusicData();
      await this.loadComments();

      // Show/hide logged in features
      window.auth.updateAuthUI();
    },

    async loadMusicData() {
      try {
        const music = await window.api.get(`/music/${currentMusicId}`);
        
        document.getElementById('music-title').textContent = music.title;
        document.getElementById('music-channel').textContent = music.channel_name || 'YouTube';
        document.getElementById('music-description').textContent = music.description || '상세 설명이 없습니다.';
        document.getElementById('music-like-count').textContent = music.likesCount;
        
        const player = document.getElementById('youtube-player');
        if (player) {
          player.src = `https://www.youtube.com/embed/${music.youtube_id}?autoplay=0&rel=0`;
        }

        // Like button setup
        const likeBtn = document.getElementById('music-like-btn');
        if (music.userLiked) {
          likeBtn.classList.add('liked');
          likeBtn.querySelector('.heart-icon').textContent = '❤️';
        } else {
          likeBtn.classList.remove('liked');
          likeBtn.querySelector('.heart-icon').textContent = '🤍';
        }

        likeBtn.onclick = () => this.toggleMusicLike();

        // Render hashtags
        this.renderHashtags(music.hashtags);
        
        // Add hashtag listener
        const addTagBtn = document.getElementById('add-hashtag-btn');
        addTagBtn.onclick = () => this.addHashtags();
      } catch (err) {
        console.error('Failed to load music detail:', err);
        window.showToast?.('음악 정보를 불러오지 못했습니다.', 'danger');
      }
    },

    async toggleMusicLike() {
      if (!window.auth.isLoggedIn()) {
        window.auth.showAuthModal('login');
        return;
      }

      try {
        const likeBtn = document.getElementById('music-like-btn');
        const countSpan = document.getElementById('music-like-count');
        
        const data = await window.api.post(`/likes/music/${currentMusicId}/like`);
        
        countSpan.textContent = data.likeCount;
        if (data.liked) {
          likeBtn.classList.add('liked');
          likeBtn.querySelector('.heart-icon').textContent = '❤️';
          likeBtn.querySelector('.heart-icon').style.animation = 'heartPop 0.3s ease';
          window.showToast?.('좋아요 한 음악 목록에 추가되었습니다.', 'success');
        } else {
          likeBtn.classList.remove('liked');
          likeBtn.querySelector('.heart-icon').textContent = '🤍';
          likeBtn.querySelector('.heart-icon').style.animation = '';
        }
      } catch (err) {
        console.error('Error toggling music like:', err);
      }
    },

    renderHashtags(tags) {
      const container = document.getElementById('hashtag-list');
      if (!container) return;

      if (!tags || tags.length === 0) {
        container.innerHTML = '<span class="text-muted">추가된 해시태그가 없습니다. 첫 해시태그를 달아보세요!</span>';
        return;
      }

      const currentUser = window.auth.getCurrentUser();

      container.innerHTML = tags.map(tag => `
        <span class="hashtag-chip">
          <a href="#/search?q=%23${encodeURIComponent(tag.tag)}&type=hashtag">#${this.escapeHTML(tag.tag)}</a>
          ${(currentUser && (tag.user_id === currentUser.id || currentUser.role === 'admin')) ? `
            <button class="remove-tag-btn" data-id="${tag.id}">&times;</button>
          ` : ''}
        </span>
      `).join('');

      // Add delete hashtag listeners
      container.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const tagId = btn.dataset.id;
          if (confirm('이 해시태그를 정말 삭제하시겠습니까?')) {
            try {
              await window.api.delete(`/hashtags/music/${currentMusicId}/${tagId}`);
              window.showToast?.('해시태그가 제거되었습니다.', 'success');
              this.loadMusicData();
            } catch (err) {
              window.showToast?.('해시태그 제거 실패: ' + (err.error || '권한이 없습니다.'), 'danger');
            }
          }
        };
      });
    },

    async addHashtags() {
      const input = document.getElementById('new-hashtag-input');
      const val = input.value.trim();
      if (!val) return;

      // split by comma or space
      const tags = val.split(/[,#\s]+/).map(t => t.trim()).filter(t => t.length > 0);
      if (tags.length === 0) return;

      try {
        const data = await window.api.post(`/hashtags/music/${currentMusicId}`, { tags });
        input.value = '';
        this.renderHashtags(data.hashtags);
        window.showToast?.('해시태그가 추가되었습니다.', 'success');
      } catch (err) {
        window.showToast?.(err.error || '해시태그 추가 실패', 'danger');
      }
    },

    async loadComments() {
      const container = document.getElementById('comments-container');
      if (!container) return;

      try {
        const data = await window.api.get(`/comments/music/${currentMusicId}/comments`);
        this.renderComments(data.comments);
      } catch (err) {
        container.innerHTML = '<div class="text-center py-4 text-danger">댓글을 불러오지 못했습니다.</div>';
      }
    },

    renderComments(comments) {
      const container = document.getElementById('comments-container');
      if (!container) return;

      if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted">등록된 댓글이 없습니다. 의견을 나누어 보세요!</div>';
        return;
      }

      const currentUser = window.auth.getCurrentUser();

      container.innerHTML = comments.map(c => {
        const initial = c.display_name ? c.display_name.substring(0, 1).toUpperCase() : 'U';
        const isOwner = currentUser && (c.user_id === currentUser.id || currentUser.role === 'admin');
        const heart = c.user_liked ? '❤️' : '🤍';
        const likedClass = c.user_liked ? 'liked' : '';

        return `
          <div class="comment-card" id="comment-${c.id}">
            <div class="comment-header">
              <div class="comment-user">
                <div class="comment-avatar">${initial}</div>
                <div>
                  <div class="comment-author">${this.escapeHTML(c.display_name)}</div>
                  <div class="comment-time">${this.formatRelativeTime(c.created_at)}</div>
                </div>
              </div>
              <div class="comment-actions">
                ${isOwner ? `<button class="btn-delete-comment text-danger" data-id="${c.id}">삭제</button>` : ''}
              </div>
            </div>
            <div class="comment-body">
              ${this.escapeHTML(c.content).replace(/\n/g, '<br>')}
            </div>
            <div class="comment-footer">
              <button class="comment-like-btn ${likedClass}" data-id="${c.id}">
                <span class="comment-heart">${heart}</span>
                <span class="comment-like-count">${c.like_count}</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Setup submit handler for comments
      const form = document.getElementById('comment-form');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const txt = document.getElementById('comment-text');
          const content = txt.value.trim();
          if (!content) return;

          try {
            await window.api.post(`/comments/music/${currentMusicId}/comments`, { content });
            txt.value = '';
            await this.loadComments();
            window.showToast?.('댓글이 성공적으로 등록되었습니다.', 'success');
          } catch (err) {
            window.showToast?.(err.error || '댓글 등록 실패', 'danger');
          }
        };
      }

      // Setup delete listeners
      container.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('댓글을 삭제하시겠습니까?')) {
            try {
              await window.api.delete(`/comments/${btn.dataset.id}`);
              await this.loadComments();
              window.showToast?.('댓글이 삭제되었습니다.', 'success');
            } catch (err) {
              window.showToast?.(err.error || '댓글 삭제 실패', 'danger');
            }
          }
        };
      });

      // Setup comment like listeners
      container.querySelectorAll('.comment-like-btn').forEach(btn => {
        btn.onclick = async () => {
          if (!window.auth.isLoggedIn()) {
            window.auth.showAuthModal('login');
            return;
          }

          const commentId = btn.dataset.id;
          try {
            const data = await window.api.post(`/likes/comments/${commentId}/like`);
            const heartSpan = btn.querySelector('.comment-heart');
            const countSpan = btn.querySelector('.comment-like-count');

            countSpan.textContent = data.likeCount;
            if (data.liked) {
              btn.classList.add('liked');
              heartSpan.textContent = '❤️';
              heartSpan.style.animation = 'heartPop 0.3s ease';
            } else {
              btn.classList.remove('liked');
              heartSpan.textContent = '🤍';
              heartSpan.style.animation = '';
            }
          } catch (err) {
            console.error('Error liking comment:', err);
          }
        };
      });
    },

    formatRelativeTime(dateStr) {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    },

    escapeHTML(str) {
      if (!str) return '';
      return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }
  };

  window.musicDetail = musicDetail;
})();
