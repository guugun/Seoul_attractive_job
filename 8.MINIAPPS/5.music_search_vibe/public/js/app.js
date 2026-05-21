(function () {
  const app = {
    init() {
      // 1. Initial Auth UI update
      window.auth.updateAuthUI();

      // 2. Initialize real-time notifications if logged in
      if (window.auth.isLoggedIn()) {
        window.notifications.init();
      }

      // 3. Theme Toggle setup
      this.initTheme();

      // 4. Set up general listeners (forms, auth, modals, etc.)
      this.setupGlobalListeners();

      // 5. Setup SPA Router
      window.addEventListener('hashchange', () => this.router());
      this.router();
    },

    initTheme() {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      this.updateThemeToggleIcon(savedTheme);

      const toggleBtn = document.getElementById('theme-toggle');
      toggleBtn?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeToggleIcon(newTheme);
      });
    },

    updateThemeToggleIcon(theme) {
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      }
    },

    setupGlobalListeners() {
      // Navbar scroll effect
      window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 10) {
          nav?.classList.add('scrolled');
        } else {
          nav?.classList.remove('scrolled');
        }
      });

      // Mobile menu toggle
      const hamburger = document.getElementById('hamburger-btn');
      const mobileNav = document.getElementById('mobile-nav');
      
      hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav?.classList.toggle('open');
      });

      // Close mobile menu on clicking links
      mobileNav?.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
          hamburger?.classList.remove('open');
          mobileNav?.classList.remove('open');
        }
      });

      // User avatar dropdown toggle
      const avatarBtn = document.getElementById('user-avatar-btn');
      const userDropdown = document.getElementById('user-dropdown');
      
      avatarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.classList.contains('hidden')) {
          if (!userDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
            userDropdown.classList.add('hidden');
          }
        }
      });

      // Notification bell dropdown toggle
      const bellBtn = document.getElementById('notification-bell');
      bellBtn?.addEventListener('click', (e) => {
        window.notifications?.toggleDropdown(e);
      });

      // Notification read all
      const readAllBtn = document.getElementById('notif-read-all-btn');
      readAllBtn?.addEventListener('click', () => {
        window.notifications?.markAllAsRead();
      });

      // Global navbar search form
      const navSearchForm = document.getElementById('nav-search-form');
      navSearchForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('nav-search-input');
        const query = input.value.trim();
        if (query) {
          input.value = '';
          window.location.hash = `#/search?q=${encodeURIComponent(query)}&type=title&page=1`;
        }
      });

      // Auth modal setup
      const modal = document.getElementById('auth-modal');
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
          window.auth.hideAuthModal();
        }
      });

      const closeAuthBtn = document.getElementById('close-auth-btn');
      closeAuthBtn?.addEventListener('click', () => {
        window.auth.hideAuthModal();
      });

      // Auth forms
      const loginForm = document.getElementById('login-form');
      loginForm?.addEventListener('submit', (e) => window.auth.handleLogin(e));

      const registerForm = document.getElementById('register-form');
      registerForm?.addEventListener('submit', (e) => window.auth.handleRegister(e));
    },

    router() {
      const hash = window.location.hash || '#/';
      
      // Parse hash path and query parameters
      // Example: #/search?q=lofi&type=title
      const pathPart = hash.split('?')[0];
      const queryPart = hash.split('?')[1] || '';
      
      const queryParams = new URLSearchParams(queryPart);

      // Route mappings
      if (pathPart === '#/' || pathPart === '#') {
        this.renderHome();
      } else if (pathPart === '#/search') {
        window.search.render(queryParams);
      } else if (pathPart.startsWith('#/music/')) {
        // extract ID
        const parts = pathPart.split('/');
        const id = parts[parts.length - 1];
        queryParams.set('id', id);
        window.musicDetail.render(queryParams);
      } else if (pathPart === '#/profile') {
        window.profile.render(queryParams);
      } else if (pathPart === '#/admin') {
        window.admin.render(queryParams);
      } else {
        // 404
        document.getElementById('app-content').innerHTML = `
          <div class="container mt-5">
            <div class="empty-state">
              <div class="empty-icon">❓</div>
              <h3>페이지를 찾을 수 없습니다.</h3>
              <p>올바른 주소인지 다시 한 번 확인해 주세요.</p>
              <button class="btn btn-primary mt-3" onclick="window.location.hash = '#/'">홈으로 이동</button>
            </div>
          </div>
        `;
      }

      // Close dropdowns on routing
      document.getElementById('user-dropdown')?.classList.add('hidden');
      document.getElementById('notification-dropdown')?.classList.add('hidden');
      
      // Update active nav links
      document.querySelectorAll('.navbar-links a').forEach(link => {
        if (link.getAttribute('href') === pathPart) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    },

    async renderHome() {
      const container = document.getElementById('app-content');
      if (!container) return;

      container.innerHTML = `
        <div class="container fade-in">
          <!-- Hero Section -->
          <div class="hero">
            <h1>Music Search Vibe 🎵</h1>
            <p>유튜브 음악을 검색하고 소통하며 나만의 음악 해시태그 분위기(Vibe)를 찾아보세요.</p>
            <div class="hero-search">
              <form id="hero-search-form">
                <span class="search-icon">🔍</span>
                <input type="text" id="hero-search-input" placeholder="좋아하는 가수, 제목 또는 해시태그를 검색해보세요..." required autocomplete="off">
                <button type="submit">검색</button>
              </form>
            </div>
          </div>

          <!-- Content Grid -->
          <div class="grid-detail mt-4">
            <!-- Left Area: Recent Music -->
            <div class="detail-main">
              <div class="section-header">
                <h2>🔥 최근 가입자들이 검색한 음악</h2>
                <a href="#/search">더보기 &rarr;</a>
              </div>
              <div id="home-recent-music" class="grid-2">
                <!-- Skeleton cards -->
                ${Array(4).fill(0).map(() => `
                  <div class="card skeleton-card">
                    <div class="skeleton skeleton-thumb"></div>
                    <div class="skeleton skeleton-title"></div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Right Area: Popular Hashtags -->
            <div class="detail-sidebar">
              <div class="card p-4">
                <h3 class="mb-3">🌟 실시간 인기 Vibe 태그</h3>
                <div id="home-popular-tags" class="hashtag-container">
                  <span class="text-muted">인기 해시태그 불러오는 중...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Set up search form submission
      const form = document.getElementById('hero-search-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('hero-search-input');
        const val = input.value.trim();
        if (val) {
          // If searching with hash, make it hashtag type
          const isHashtag = val.startsWith('#');
          const type = isHashtag ? 'hashtag' : 'title';
          const query = isHashtag ? val.substring(1) : val;
          window.location.hash = `#/search?q=${encodeURIComponent(query)}&type=${type}&page=1`;
        }
      });

      // Load data
      await this.loadHomeData();
    },

    async loadHomeData() {
      // 1. Load recent music
      try {
        const recentRes = await window.api.get('/music');
        const container = document.getElementById('home-recent-music');
        
        if (container) {
          if (!recentRes.music || recentRes.music.length === 0) {
            container.innerHTML = `
              <div class="card p-4 text-center text-muted" style="grid-column: span 2;">
                아직 등록된 음악이 없습니다. 검색을 통해 음악을 등록해보세요!
              </div>
            `;
          } else {
            container.innerHTML = recentRes.music.slice(0, 8).map(m => `
              <div class="music-card card cursor-pointer" data-id="${m.id}">
                <div class="card-thumbnail-container">
                  <img src="${m.thumbnail}" alt="${this.escapeHTML(m.title)}" class="card-thumbnail" loading="lazy">
                  ${m.duration ? `<span class="duration-badge">${m.duration}</span>` : ''}
                  <div class="play-overlay"><span class="play-icon">▶</span></div>
                </div>
                <div class="card-body">
                  <h3 class="card-title text-ellipsis">${this.escapeHTML(m.title)}</h3>
                  <p class="card-channel text-ellipsis">${this.escapeHTML(m.channel_name || 'YouTube')}</p>
                  ${m.tags ? `
                    <div class="hashtag-container-preview mt-2">
                      ${m.tags.split(',').slice(0, 3).map(tag => `<span class="hashtag-preview-chip">#${this.escapeHTML(tag)}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('');

            // Click handlers
            container.querySelectorAll('.music-card').forEach(card => {
              card.onclick = () => {
                window.location.hash = `#/music/${card.dataset.id}`;
              };
            });
          }
        }
      } catch (err) {
        console.error('Failed to load recent music:', err);
      }

      // 2. Load popular hashtags
      try {
        const popularRes = await window.api.get('/hashtags/popular');
        const container = document.getElementById('home-popular-tags');
        
        if (container) {
          if (!popularRes.hashtags || popularRes.hashtags.length === 0) {
            container.innerHTML = `<span class="text-muted">아직 등록된 해시태그가 없습니다.</span>`;
          } else {
            container.innerHTML = popularRes.hashtags.map(t => `
              <span class="hashtag-chip">
                <a href="#/search?q=%23${encodeURIComponent(t.tag)}&type=hashtag">#${this.escapeHTML(t.tag)} (${t.count})</a>
              </span>
            `).join('');
          }
        }
      } catch (err) {
        console.error('Failed to load popular hashtags:', err);
      }
    },

    escapeHTML(str) {
      if (!str) return '';
      return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }
  };

  window.app = app;
  
  // Start the app when DOM is ready
  document.addEventListener('DOMContentLoaded', () => app.init());
})();
