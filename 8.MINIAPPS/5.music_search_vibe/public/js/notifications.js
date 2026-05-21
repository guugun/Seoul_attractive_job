(function () {
  let eventSource = null;
  let reconnectTimeout = null;
  let reconnectDelay = 1000;

  const notifications = {
    notificationsList: [],
    unreadCount: 0,

    init() {
      // Event listener for document clicks to close notification dropdown
      document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notification-dropdown');
        const bellBtn = document.getElementById('notification-bell');
        
        if (dropdown && !dropdown.classList.contains('hidden')) {
          if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
            dropdown.classList.add('hidden');
          }
        }
      });

      this.initSSE();
      this.loadNotifications();
    },

    initSSE() {
      if (!window.auth.isLoggedIn()) return;
      this.closeSSE();

      const token = localStorage.getItem('token');
      // Create EventSource connection with token as query param
      eventSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_comment') {
            this.showToast(data.message, 'success');
            // Refresh list and badge
            this.loadNotifications();
            
            // If we are on the music detail page, refresh comments
            if (window.location.hash.startsWith('#/music/')) {
              const currentMusicId = window.location.hash.split('/').pop();
              if (parseInt(currentMusicId) === data.musicId) {
                window.musicDetail?.loadComments?.();
              }
            }
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        this.closeSSE();
        
        // Attempt reconnect with exponential backoff
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          console.log('Attempting SSE reconnect...');
          this.initSSE();
          reconnectDelay = Math.min(reconnectDelay * 2, 30000); // Max 30 seconds
        }, reconnectDelay);
      };

      eventSource.onopen = () => {
        reconnectDelay = 1000; // Reset delay
      };
    },

    closeSSE() {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      clearTimeout(reconnectTimeout);
    },

    async loadNotifications() {
      if (!window.auth.isLoggedIn()) return;

      try {
        const data = await window.api.get('/notifications');
        this.notificationsList = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
        this.updateBadge();
        this.renderDropdown();
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    },

    updateBadge() {
      const bell = document.getElementById('notification-bell');
      let badge = document.getElementById('notification-badge');

      if (this.unreadCount > 0) {
        bell?.classList.add('has-unread');
        
        if (!badge) {
          badge = document.createElement('span');
          badge.id = 'notification-badge';
          badge.className = 'notification-badge';
          bell?.appendChild(badge);
        }
        badge.textContent = this.unreadCount;
      } else {
        bell?.classList.remove('has-unread');
        badge?.remove();
      }
    },

    toggleDropdown(e) {
      e?.stopPropagation();
      if (!window.auth.isLoggedIn()) {
        window.auth.showAuthModal('login');
        return;
      }
      
      const dropdown = document.getElementById('notification-dropdown');
      if (dropdown) {
        dropdown.classList.toggle('hidden');
        if (!dropdown.classList.contains('hidden')) {
          this.loadNotifications();
        }
      }
    },

    renderDropdown() {
      const container = document.getElementById('notification-list');
      if (!container) return;

      if (this.notificationsList.length === 0) {
        container.innerHTML = `<div class="notification-empty">새로운 알림이 없습니다.</div>`;
        return;
      }

      container.innerHTML = this.notificationsList.map(notif => `
        <div class="notification-item ${notif.is_read ? '' : 'unread'}" data-id="${notif.id}" data-music-id="${notif.music_id || ''}">
          ${notif.is_read ? '' : '<div class="notif-dot"></div>'}
          <div class="notif-content">
            <div class="notif-text">${this.escapeHTML(notif.message)}</div>
            <div class="notif-time">${this.formatTime(notif.created_at)}</div>
          </div>
        </div>
      `).join('');

      // Add click listeners to items
      container.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async () => {
          const id = item.dataset.id;
          const musicId = item.dataset.musicId;

          // Mark as read
          await this.markAsRead(id);

          // Hide dropdown
          document.getElementById('notification-dropdown')?.classList.add('hidden');

          // Navigate if musicId exists
          if (musicId) {
            window.location.hash = `#/music/${musicId}`;
          }
        });
      });
    },

    async markAsRead(id) {
      try {
        await window.api.put(`/notifications/${id}/read`);
        this.loadNotifications();
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },

    async markAllAsRead() {
      try {
        await window.api.put('/notifications/read-all');
        this.loadNotifications();
        window.showToast?.('모든 알림을 읽음 처리했습니다.', 'success');
      } catch (err) {
        console.error('Failed to mark all read:', err);
      }
    },

    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type} fade-in`;
      
      let icon = '🔔';
      if (type === 'success') icon = '✅';
      if (type === 'danger') icon = '❌';
      if (type === 'warning') icon = '⚠️';

      toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${this.escapeHTML(message)}</span>
      `;

      container.appendChild(toast);

      // Animate out and remove
      setTimeout(() => {
        toast.classList.add('slide-out');
        toast.addEventListener('animationend', () => toast.remove());
      }, 5000);
    },

    formatTime(dateStr) {
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
      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    },

    escapeHTML(str) {
      if (!str) return '';
      return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }
  };

  window.notifications = notifications;
  window.showToast = notifications.showToast.bind(notifications);
})();
