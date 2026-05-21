(function () {
  let currentTab = 'stats';
  let currentPage = 1;
  let currentSearch = '';

  const admin = {
    async render(params) {
      const container = document.getElementById('app-content');
      if (!container) return;

      const user = window.auth.getCurrentUser();
      if (!user || user.role !== 'admin') {
        container.innerHTML = `
          <div class="container mt-5">
            <div class="empty-state">
              <div class="empty-icon">⚠️</div>
              <h3>접근 권한이 없습니다</h3>
              <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
              <button class="btn btn-primary mt-3" onclick="window.location.hash = '#/'">홈으로 이동</button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="container fade-in">
          <div class="admin-header mb-4 mt-4">
            <h1>관리자 대시보드</h1>
            <p>회원 정보, 등록된 음악 및 작성된 댓글을 관리할 수 있습니다.</p>
          </div>

          <!-- Stats Overview Cards -->
          <div class="grid-4 mb-4" id="admin-stats-cards">
            <div class="card stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <span class="stat-label">총 회원 수</span>
                <h3 id="stat-total-users">0</h3>
              </div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon">🎵</div>
              <div class="stat-info">
                <span class="stat-label">총 음악 수</span>
                <h3 id="stat-total-music">0</h3>
              </div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon">💬</div>
              <div class="stat-info">
                <span class="stat-label">총 댓글 수</span>
                <h3 id="stat-total-comments">0</h3>
              </div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon">❤️</div>
              <div class="stat-info">
                <span class="stat-label">총 소통(좋아요) 수</span>
                <h3 id="stat-total-likes">0</h3>
              </div>
            </div>
          </div>

          <!-- Admin Panel Tabs -->
          <div class="admin-panel card">
            <div class="admin-tabs border-bottom">
              <button class="admin-tab-btn active" data-tab="stats">개요</button>
              <button class="admin-tab-btn" data-tab="users">회원 관리</button>
              <button class="admin-tab-btn" data-tab="music">음악 관리</button>
              <button class="admin-tab-btn" data-tab="comments">댓글 관리</button>
            </div>

            <!-- Search and Filter Bar -->
            <div id="admin-filter-bar" class="admin-filter-bar p-3 border-bottom hidden">
              <div class="admin-search-wrapper">
                <input type="text" id="admin-search-input" placeholder="검색어 입력...">
                <button id="admin-search-btn" class="btn btn-primary btn-sm">검색</button>
              </div>
            </div>

            <div id="admin-tab-content" class="p-3">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      `;

      this.setupTabs();
      await this.loadStats();
      this.renderOverview();
    },

    setupTabs() {
      const tabs = document.querySelectorAll('.admin-tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          currentTab = tab.dataset.tab;
          currentPage = 1;
          currentSearch = '';

          const filterBar = document.getElementById('admin-filter-bar');
          const searchInput = document.getElementById('admin-search-input');
          if (searchInput) searchInput.value = '';

          if (currentTab === 'stats') {
            filterBar?.classList.add('hidden');
            this.renderOverview();
          } else {
            filterBar?.classList.remove('hidden');
            if (currentTab === 'users') {
              if (searchInput) searchInput.placeholder = '아이디, 이메일, 닉네임 검색...';
            } else if (currentTab === 'music') {
              if (searchInput) searchInput.placeholder = '음악 제목, 유튜브 ID 검색...';
            } else if (currentTab === 'comments') {
              if (searchInput) searchInput.placeholder = '댓글 내용, 작성자 검색...';
            }
            this.loadTabContent();
          }
        });
      });

      // Filter/Search submit
      const searchBtn = document.getElementById('admin-search-btn');
      const searchInput = document.getElementById('admin-search-input');
      
      const triggerSearch = () => {
        currentSearch = searchInput ? searchInput.value.trim() : '';
        currentPage = 1;
        this.loadTabContent();
      };

      searchBtn?.addEventListener('click', triggerSearch);
      searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSearch();
      });
    },

    async loadStats() {
      try {
        const stats = await window.api.get('/admin/stats');
        document.getElementById('stat-total-users').textContent = stats.totalUsers;
        document.getElementById('stat-total-music').textContent = stats.totalMusic;
        document.getElementById('stat-total-comments').textContent = stats.totalComments;
        document.getElementById('stat-total-likes').textContent = stats.totalLikes;
        this.statsData = stats;
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      }
    },

    renderOverview() {
      const container = document.getElementById('admin-tab-content');
      if (!container || !this.statsData) return;

      const { recentUsers = [], recentComments = [] } = this.statsData;

      container.innerHTML = `
        <div class="grid-2">
          <!-- Recent Users -->
          <div class="card p-3 bg-surface-dark">
            <h3 class="mb-3">최근 가입한 회원</h3>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>아이디</th>
                    <th>닉네임</th>
                    <th>가입일</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentUsers.length === 0 ? '<tr><td colspan="3" class="text-center">최근 가입자가 없습니다.</td></tr>' : recentUsers.map(u => `
                    <tr>
                      <td>${this.escapeHTML(u.username)}</td>
                      <td>${this.escapeHTML(u.display_name)}</td>
                      <td>${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent Comments -->
          <div class="card p-3 bg-surface-dark">
            <h3 class="mb-3">최근 작성된 댓글</h3>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>닉네임</th>
                    <th>댓글 내용</th>
                    <th>작성일</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentComments.length === 0 ? '<tr><td colspan="3" class="text-center">최근 작성된 댓글이 없습니다.</td></tr>' : recentComments.map(c => `
                    <tr>
                      <td>${this.escapeHTML(c.display_name)}</td>
                      <td class="text-ellipsis max-w-200">${this.escapeHTML(c.content)}</td>
                      <td>${new Date(c.created_at).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    async loadTabContent() {
      const container = document.getElementById('admin-tab-content');
      if (!container) return;

      container.innerHTML = `<div class="text-center py-4">데이터 로딩 중...</div>`;

      try {
        const query = `?search=${encodeURIComponent(currentSearch)}&page=${currentPage}&limit=10`;
        const data = await window.api.get(`/admin/${currentTab}${query}`);
        
        if (currentTab === 'users') {
          this.renderUsers(data.users, data.pagination);
        } else if (currentTab === 'music') {
          this.renderMusic(data.music, data.pagination);
        } else if (currentTab === 'comments') {
          this.renderComments(data.comments, data.pagination);
        }
      } catch (err) {
        container.innerHTML = `<div class="text-center py-4 text-danger">데이터를 로드하는 중 오류가 발생했습니다.</div>`;
      }
    },

    renderUsers(users, pagination) {
      const container = document.getElementById('admin-tab-content');
      if (!container) return;

      const user = window.auth.getCurrentUser();

      container.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>아이디</th>
                <th>닉네임</th>
                <th>이메일</th>
                <th>권한</th>
                <th>가입일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>${u.id}</td>
                  <td>${this.escapeHTML(u.username)}</td>
                  <td>${this.escapeHTML(u.display_name)}</td>
                  <td>${this.escapeHTML(u.email)}</td>
                  <td>
                    <select class="role-select" data-id="${u.id}" ${u.id === user.id ? 'disabled' : ''}>
                      <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                      <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                  </td>
                  <td>${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    ${u.id === user.id ? '<span class="text-muted font-sm">본인</span>' : `
                      <button class="btn btn-danger btn-xs delete-user-btn" data-id="${u.id}">삭제</button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${this.renderPagination(pagination)}
      `;

      // Setup user event handlers
      container.querySelectorAll('.role-select').forEach(sel => {
        sel.onchange = async () => {
          const id = sel.dataset.id;
          const role = sel.value;
          try {
            await window.api.put(`/admin/users/${id}`, { role });
            window.showToast?.('회원 권한이 성공적으로 수정되었습니다.', 'success');
            this.loadStats(); // reload numbers
          } catch (err) {
            window.showToast?.(err.error || '권한 수정 실패', 'danger');
            this.loadTabContent(); // revert select UI
          }
        };
      });

      container.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          if (confirm('회원을 삭제하면 해당 사용자가 작성한 모든 글, 댓글, 좋아요가 삭제됩니다. 정말 삭제하시겠습니까?')) {
            try {
              const res = await window.api.delete(`/admin/users/${id}`);
              window.showToast?.(res.message || '회원이 삭제되었습니다.', 'success');
              this.loadStats();
              this.loadTabContent();
            } catch (err) {
              window.showToast?.(err.error || '회원 삭제 실패', 'danger');
            }
          }
        };
      });
    },

    renderMusic(musicList, pagination) {
      const container = document.getElementById('admin-tab-content');
      if (!container) return;

      container.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>썸네일</th>
                <th>제목</th>
                <th>채널</th>
                <th>댓글 수</th>
                <th>좋아요 수</th>
                <th>해시태그 수</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              ${musicList.map(m => `
                <tr>
                  <td><img src="${m.thumbnail}" alt="" class="table-thumb"></td>
                  <td class="text-ellipsis max-w-250"><a href="#/music/${m.id}">${this.escapeHTML(m.title)}</a></td>
                  <td>${this.escapeHTML(m.channel_name || 'YouTube')}</td>
                  <td>${m.comment_count}</td>
                  <td>${m.like_count}</td>
                  <td>${m.hashtag_count}</td>
                  <td>${new Date(m.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button class="btn btn-danger btn-xs delete-music-btn" data-id="${m.id}">삭제</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${this.renderPagination(pagination)}
      `;

      container.querySelectorAll('.delete-music-btn').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          if (confirm('이 음악을 삭제하면 음악과 관련된 모든 댓글, 좋아요, 해시태그가 완전히 삭제됩니다. 정말 삭제하시겠습니까?')) {
            try {
              const res = await window.api.delete(`/admin/music/${id}`);
              window.showToast?.(res.message || '음악이 삭제되었습니다.', 'success');
              this.loadStats();
              this.loadTabContent();
            } catch (err) {
              window.showToast?.(err.error || '음악 삭제 실패', 'danger');
            }
          }
        };
      });
    },

    renderComments(comments, pagination) {
      const container = document.getElementById('admin-tab-content');
      if (!container) return;

      container.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>음악 정보</th>
                <th>닉네임</th>
                <th>댓글 내용</th>
                <th>좋아요</th>
                <th>작성일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              ${comments.map(c => `
                <tr>
                  <td class="text-ellipsis max-w-200"><a href="#/music/${c.music_id}">${this.escapeHTML(c.music_title)}</a></td>
                  <td>${this.escapeHTML(c.display_name)}</td>
                  <td class="text-ellipsis max-w-300">${this.escapeHTML(c.content)}</td>
                  <td>${c.like_count}</td>
                  <td>${new Date(c.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button class="btn btn-danger btn-xs delete-comment-btn" data-id="${c.id}">삭제</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${this.renderPagination(pagination)}
      `;

      container.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          if (confirm('이 댓글을 정말 삭제하시겠습니까?')) {
            try {
              const res = await window.api.delete(`/admin/comments/${id}`);
              window.showToast?.(res.message || '댓글이 삭제되었습니다.', 'success');
              this.loadStats();
              this.loadTabContent();
            } catch (err) {
              window.showToast?.(err.error || '댓글 삭제 실패', 'danger');
            }
          }
        };
      });
    },

    renderPagination(pagination) {
      if (!pagination || pagination.totalPages <= 1) return '';

      let btns = '';
      for (let i = 1; i <= pagination.totalPages; i++) {
        btns += `
          <button class="pag-btn ${pagination.page === i ? 'active' : ''}" data-page="${i}">${i}</button>
        `;
      }

      setTimeout(() => {
        document.querySelectorAll('.pag-btn').forEach(btn => {
          btn.onclick = () => {
            currentPage = parseInt(btn.dataset.page);
            this.loadTabContent();
          };
        });
      }, 0);

      return `
        <div class="pagination flex justify-center gap-1 mt-3">
          ${btns}
        </div>
      `;
    },

    escapeHTML(str) {
      if (!str) return '';
      return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }
  };

  window.admin = admin;
})();
