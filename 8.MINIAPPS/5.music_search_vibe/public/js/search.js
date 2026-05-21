(function () {
  const search = {
    async render(params) {
      const container = document.getElementById('app-content');
      if (!container) return;

      const q = params.get('q') || '';
      const type = params.get('type') || 'title';
      const page = parseInt(params.get('page')) || 1;

      container.innerHTML = `
        <div class="container fade-in">
          <div class="search-header hero">
            <h1>음악 검색</h1>
            <p>유튜브 음악과 해시태그를 통해 새로운 음악의 분위기(Vibe)를 느껴보세요.</p>
          </div>

          <div class="search-form-container card mb-4">
            <form id="search-page-form" class="search-form">
              <div class="search-tabs">
                <button type="button" class="search-tab-btn ${type === 'title' ? 'active' : ''}" data-type="title">제목 검색</button>
                <button type="button" class="search-tab-btn ${type === 'description' ? 'active' : ''}" data-type="description">설명 검색</button>
                <button type="button" class="search-tab-btn ${type === 'hashtag' ? 'active' : ''}" data-type="hashtag">해시태그 검색</button>
              </div>
              <div class="search-input-group mt-3">
                <input type="text" id="search-page-input" placeholder="검색어를 입력하세요..." value="${this.escapeHTML(q)}" required>
                <button type="submit" class="btn btn-primary">검색</button>
              </div>
            </form>
          </div>

          <div id="search-results-section">
            <div id="search-loader" class="hidden">
              <div class="skeleton-grid">
                ${Array(4).fill(0).map(() => `
                  <div class="card skeleton-card">
                    <div class="skeleton skeleton-thumb"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div id="search-results-content"></div>
          </div>
        </div>
      `;

      this.setupEventListeners(q, type, page);

      if (q) {
        this.performSearch(q, type, page);
      } else {
        document.getElementById('search-results-content').innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎵</div>
            <h3>검색어를 입력하고 원하는 음악을 찾아보세요</h3>
            <p>제목, 비디오 설명, 또는 등록된 해시태그를 통해 검색할 수 있습니다.</p>
          </div>
        `;
      }
    },

    setupEventListeners(q, type, page) {
      const form = document.getElementById('search-page-form');
      const tabs = document.querySelectorAll('.search-tab-btn');
      let currentType = type;

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentType = tab.dataset.type;
          
          const input = document.getElementById('search-page-input');
          if (currentType === 'hashtag') {
            input.placeholder = '해시태그 검색 (예: 신나는, 편안한)...';
          } else {
            input.placeholder = '검색어를 입력하세요...';
          }
        });
      });

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('search-page-input');
        const query = input.value.trim();
        if (query) {
          window.location.hash = `#/search?q=${encodeURIComponent(query)}&type=${currentType}&page=1`;
        }
      });
    },

    async performSearch(query, type, page) {
      const loader = document.getElementById('search-loader');
      const content = document.getElementById('search-results-content');

      if (loader) loader.classList.remove('hidden');
      if (content) content.innerHTML = '';

      try {
        const data = await window.api.get(`/music/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`);
        
        if (loader) loader.classList.add('hidden');

        if (!data.results || data.results.length === 0) {
          content.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>검색 결과가 없습니다</h3>
              <p>다른 검색어 또는 검색 카테고리를 이용해 보세요.</p>
            </div>
          `;
          return;
        }

        content.innerHTML = `
          <div class="grid-3 search-grid" id="search-grid"></div>
          ${data.source !== 'local' && data.results.length >= 10 ? `
            <div class="text-center mt-4 mb-4">
              <button id="load-more-btn" class="btn btn-secondary">다음 결과 더보기</button>
            </div>
          ` : ''}
        `;

        const grid = document.getElementById('search-grid');
        this.renderCards(grid, data.results, data.source);

        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
          loadMoreBtn.addEventListener('click', () => {
            window.location.hash = `#/search?q=${encodeURIComponent(query)}&type=${type}&page=${page + 1}`;
          });
        }
      } catch (err) {
        console.error('Search error:', err);
        if (loader) loader.classList.add('hidden');
        content.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">❌</div>
            <h3>검색 중 오류가 발생했습니다</h3>
            <p>${err.error || 'YouTube 검색을 지원하는 Invidious API 서버가 원활하지 않습니다. 잠시 후 다시 시도해주세요.'}</p>
          </div>
        `;
      }
    },

    renderCards(container, items, source) {
      container.innerHTML = items.map((item, index) => {
        const title = this.escapeHTML(item.title);
        const channel = this.escapeHTML(item.channelName || item.channel_name || 'YouTube');
        const desc = this.escapeHTML((item.description || '').substring(0, 100));
        const thumbnail = item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
        const duration = item.duration || '';
        const id = source === 'local' ? item.id : item.videoId;
        const clickAttr = source === 'local' 
          ? `data-local-id="${id}"` 
          : `data-youtube-id="${id}" data-title="${title.replace(/"/g, '&quot;')}" data-channel="${channel.replace(/"/g, '&quot;')}" data-thumbnail="${thumbnail}" data-duration="${duration}"`;

        return `
          <div class="music-card card cursor-pointer" ${clickAttr}>
            <div class="card-thumbnail-container">
              <img src="${thumbnail}" alt="${title}" class="card-thumbnail" loading="lazy">
              ${duration ? `<span class="duration-badge">${duration}</span>` : ''}
              <div class="play-overlay">
                <span class="play-icon">▶</span>
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title text-ellipsis">${title}</h3>
              <p class="card-channel text-ellipsis">${channel}</p>
              ${item.tags ? `
                <div class="hashtag-container-preview mt-2">
                  ${item.tags.split(',').map(tag => `<span class="hashtag-preview-chip">#${this.escapeHTML(tag)}</span>`).join('')}
                </div>
              ` : `<p class="card-description text-ellipsis mt-1">${desc}</p>`}
            </div>
          </div>
        `;
      }).join('');

      // Attach click handlers to cards
      container.querySelectorAll('.music-card').forEach(card => {
        card.addEventListener('click', async () => {
          const localId = card.dataset.localId;
          const youtubeId = card.dataset.youtubeId;

          if (localId) {
            // Directly navigate if we already have local database ID
            window.location.hash = `#/music/${localId}`;
          } else if (youtubeId) {
            // First fetch or create music entry in DB
            try {
              window.showToast?.('음악을 불러오는 중...', 'info');
              const regData = await window.api.post('/music', {
                youtube_id: youtubeId,
                title: card.dataset.title,
                description: '',
                thumbnail: card.dataset.thumbnail,
                channel_name: card.dataset.channel,
                duration: card.dataset.duration
              });
              window.location.hash = `#/music/${regData.id}`;
            } catch (err) {
              console.error('Failed to register/get music:', err);
              // Fallback: check GET /youtube/:youtubeId
              try {
                const getByYt = await window.api.get(`/music/youtube/${youtubeId}`);
                window.location.hash = `#/music/${getByYt.id}`;
              } catch (err2) {
                window.showToast?.('음악 등록에 실패했습니다.', 'danger');
              }
            }
          }
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

  window.search = search;
})();
