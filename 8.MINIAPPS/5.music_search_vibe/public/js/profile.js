(function () {
  let profileUserId = null;

  const profile = {
    async render(params) {
      const container = document.getElementById('app-content');
      if (!container) return;

      const currentUser = window.auth.getCurrentUser();
      
      // If a specific userId is passed in, use that. Otherwise use current user's ID.
      const paramId = params.get('id');
      const userId = paramId ? parseInt(paramId) : (currentUser ? currentUser.id : null);

      if (!userId) {
        container.innerHTML = `
          <div class="container mt-5">
            <div class="empty-state">
              <h3>로그인이 필요합니다</h3>
              <p>프로필을 보려면 로그인 해주세요.</p>
              <button class="btn btn-primary mt-3" onclick="window.auth.showAuthModal('login')">로그인</button>
            </div>
          </div>
        `;
        return;
      }

      profileUserId = userId;
      const isOwnProfile = currentUser && currentUser.id === userId;

      container.innerHTML = `
        <div class="container fade-in">
          <div class="profile-layout mt-4">
            <!-- Profile Header Info -->
            <div class="profile-card card text-center mb-4">
              <div class="profile-avatar-large" id="profile-avatar-circle">U</div>
              <h2 id="profile-display-name" class="mt-3">로딩 중...</h2>
              <p id="profile-username" class="text-muted">@username</p>
              <p id="profile-email" class="text-muted font-sm hidden"></p>
              
              <div class="profile-stats mt-4">
                <div class="stat-item">
                  <span class="stat-value" id="stat-comments-count">0</span>
                  <span class="stat-label">작성 댓글</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" id="stat-likes-count">0</span>
                  <span class="stat-label">좋아요 한 음악</span>
                </div>
              </div>

              ${isOwnProfile ? `
                <div class="profile-edit-btn-container mt-4">
                  <button id="edit-profile-btn" class="btn btn-secondary btn-sm">프로필 편집</button>
                </div>
                <div id="profile-edit-form" class="mt-4 hidden">
                  <div class="form-group text-left">
                    <label for="edit-display-name">닉네임</label>
                    <input type="text" id="edit-display-name" class="form-control" required>
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button id="save-profile-btn" class="btn btn-primary btn-sm flex-1">저장</button>
                    <button id="cancel-profile-btn" class="btn btn-secondary btn-sm flex-1">취소</button>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Profile Tabs and Content -->
            <div class="profile-content card">
              <div class="profile-tabs border-bottom">
                <button class="profile-tab-btn active" data-tab="comments">작성한 댓글</button>
                <button class="profile-tab-btn" data-tab="likes">좋아요 한 음악</button>
              </div>

              <div id="profile-tab-content" class="tab-body mt-4">
                <!-- Tab items are rendered dynamically -->
              </div>
            </div>
          </div>
        </div>
      `;

      await this.loadUserProfile();
      this.setupTabs();

      if (isOwnProfile) {
        this.setupEditForm();
      }
    },

    async loadUserProfile() {
      try {
        let user;
        const currentUser = window.auth.getCurrentUser();
        
        if (currentUser && currentUser.id === profileUserId) {
          // If own profile, we can use local stored user data or load /me
          const meData = await window.api.get('/auth/me');
          user = meData.user;
          // Sync with local storage
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          // If viewing other user, we'll fetch stats (and simple profile info from a general user route or mock from database)
          // Since there is no public GET /api/users/:id, we can fetch their comments first to extract display name
          const commentsData = await window.api.get(`/comments/user/${profileUserId}`);
          if (commentsData.comments && commentsData.comments.length > 0) {
            user = {
              display_name: commentsData.comments[0].display_name,
              username: commentsData.comments[0].username,
              avatar_url: commentsData.comments[0].avatar_url
            };
          } else {
            user = {
              display_name: '사용자',
              username: 'user_' + profileUserId,
              avatar_url: ''
            };
          }
        }

        // Render profile info
        document.getElementById('profile-display-name').textContent = user.display_name;
        document.getElementById('profile-username').textContent = `@${user.username}`;
        
        const avatarCircle = document.getElementById('profile-avatar-circle');
        if (avatarCircle) {
          avatarCircle.textContent = user.display_name.substring(0, 1).toUpperCase();
        }

        const emailEl = document.getElementById('profile-email');
        if (emailEl && user.email) {
          emailEl.textContent = user.email;
          emailEl.classList.remove('hidden');
        }

        // Load comments count and liked music list to compute stats
        const commentsData = await window.api.get(`/comments/user/${profileUserId}`);
        const likedMusicData = await window.api.get(`/music/user/${profileUserId}/liked`);

        document.getElementById('stat-comments-count').textContent = commentsData.comments?.length || 0;
        document.getElementById('stat-likes-count').textContent = likedMusicData.music?.length || 0;

        // Save lists globally for tab switching
        this.comments = commentsData.comments || [];
        this.likedMusic = likedMusicData.music || [];

        // Initial tab render
        this.renderComments();
      } catch (err) {
        console.error('Failed to load user profile:', err);
        window.showToast?.('프로필 정보를 가져오지 못했습니다.', 'danger');
      }
    },

    setupTabs() {
      const tabs = document.querySelectorAll('.profile-tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const tabName = tab.dataset.tab;
          if (tabName === 'comments') {
            this.renderComments();
          } else {
            this.renderLikedMusic();
          }
        });
      });
    },

    setupEditForm() {
      const editBtn = document.getElementById('edit-profile-btn');
      const form = document.getElementById('profile-edit-form');
      const input = document.getElementById('edit-display-name');
      const saveBtn = document.getElementById('save-profile-btn');
      const cancelBtn = document.getElementById('cancel-profile-btn');
      const display = document.getElementById('profile-display-name');

      editBtn?.addEventListener('click', () => {
        input.value = display.textContent;
        form.classList.remove('hidden');
        editBtn.parentElement.classList.add('hidden');
      });

      cancelBtn?.addEventListener('click', () => {
        form.classList.add('hidden');
        editBtn.parentElement.classList.remove('hidden');
      });

      saveBtn?.addEventListener('click', async () => {
        const val = input.value.trim();
        if (!val) return;

        try {
          const res = await window.api.put('/auth/profile', { display_name: val });
          localStorage.setItem('user', JSON.stringify(res.user));
          
          // Update navbar display name if applicable
          window.auth.updateAuthUI();

          // Refresh page details
          display.textContent = res.user.display_name;
          const avatar = document.getElementById('profile-avatar-circle');
          if (avatar) avatar.textContent = res.user.display_name.substring(0, 1).toUpperCase();
          
          form.classList.add('hidden');
          editBtn.parentElement.classList.remove('hidden');
          window.showToast?.('프로필이 성공적으로 수정되었습니다.', 'success');
        } catch (err) {
          window.showToast?.(err.error || '프로필 수정 실패', 'danger');
        }
      });
    },

    renderComments() {
      const container = document.getElementById('profile-tab-content');
      if (!container) return;

      if (!this.comments || this.comments.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">작성한 댓글이 없습니다.</div>`;
        return;
      }

      container.innerHTML = `
        <div class="profile-comments-timeline">
          ${this.comments.map(c => `
            <div class="timeline-item card mb-3">
              <div class="timeline-meta flex items-center justify-between mb-2">
                <span class="timeline-music">
                  🎵 음악: <a href="#/music/${c.music_id}" class="timeline-music-link font-semibold">${this.escapeHTML(c.music_title)}</a>
                </span>
                <span class="timeline-time text-muted font-sm">${new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div class="timeline-body">
                ${this.escapeHTML(c.content).replace(/\n/g, '<br>')}
              </div>
              <div class="timeline-footer mt-2 text-muted font-sm flex items-center gap-1">
                <span>❤️ 댓글 좋아요: ${c.like_count}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderLikedMusic() {
      const container = document.getElementById('profile-tab-content');
      if (!container) return;

      if (!this.likedMusic || this.likedMusic.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">좋아요 한 음악이 없습니다.</div>`;
        return;
      }

      container.innerHTML = `
        <div class="grid-3 profile-liked-grid">
          ${this.likedMusic.map(m => `
            <div class="music-card card cursor-pointer" data-id="${m.id}">
              <div class="card-thumbnail-container">
                <img src="${m.thumbnail}" alt="${this.escapeHTML(m.title)}" class="card-thumbnail" loading="lazy">
                ${m.duration ? `<span class="duration-badge">${m.duration}</span>` : ''}
                <div class="play-overlay"><span class="play-icon">▶</span></div>
              </div>
              <div class="card-body">
                <h3 class="card-title text-ellipsis">${this.escapeHTML(m.title)}</h3>
                <p class="card-channel text-ellipsis">${this.escapeHTML(m.channel_name || 'YouTube')}</p>
                <div class="card-stats mt-2 text-muted font-sm flex gap-3">
                  <span>❤️ ${m.likesCount || 0}</span>
                  <span>💬 ${m.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Click handler for liked music cards
      container.querySelectorAll('.music-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          window.location.hash = `#/music/${id}`;
        });
      });
    },

    escapeHTML(str) {
      if (!str) return '';
      return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }
  };

  window.profile = profile;
})();
