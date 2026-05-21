(function () {
  const auth = {
    isLoggedIn() {
      return !!localStorage.getItem('token');
    },

    getCurrentUser() {
      const userStr = localStorage.getItem('user');
      try {
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },

    showAuthModal(tab = 'login') {
      const modal = document.getElementById('auth-modal');
      if (modal) {
        modal.classList.add('active');
        this.switchTab(tab);
      }
    },

    hideAuthModal() {
      const modal = document.getElementById('auth-modal');
      if (modal) {
        modal.classList.remove('active');
      }
    },

    switchTab(tab) {
      const loginTabBtn = document.getElementById('tab-login-btn');
      const registerTabBtn = document.getElementById('tab-register-btn');
      const loginForm = document.getElementById('login-form-container');
      const registerForm = document.getElementById('register-form-container');

      if (tab === 'login') {
        loginTabBtn?.classList.add('active');
        registerTabBtn?.classList.remove('active');
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
      } else {
        loginTabBtn?.classList.remove('active');
        registerTabBtn?.classList.add('active');
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
      }
    },

    async handleLogin(e) {
      e.preventDefault();
      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      const errorMsg = document.getElementById('login-error');

      if (errorMsg) errorMsg.textContent = '';

      try {
        const data = await window.api.post('/auth/login', {
          username: usernameInput.value,
          password: passwordInput.value
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        this.hideAuthModal();
        this.updateAuthUI();
        
        // Re-init notifications and reload page logic
        if (window.notifications && typeof window.notifications.initSSE === 'function') {
          window.notifications.initSSE();
        }

        window.showToast?.('로그인에 성공했습니다.', 'success');

        // Redirect to homepage or refresh current route
        window.app?.router();
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.error || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
        }
      }
    },

    async handleRegister(e) {
      e.preventDefault();
      const usernameInput = document.getElementById('register-username');
      const emailInput = document.getElementById('register-email');
      const displayNameInput = document.getElementById('register-display-name');
      const passwordInput = document.getElementById('register-password');
      const passwordConfirmInput = document.getElementById('register-password-confirm');
      const errorMsg = document.getElementById('register-error');

      if (errorMsg) errorMsg.textContent = '';

      if (passwordInput.value !== passwordConfirmInput.value) {
        if (errorMsg) errorMsg.textContent = '비밀번호가 일치하지 않습니다.';
        return;
      }

      try {
        const data = await window.api.post('/auth/register', {
          username: usernameInput.value,
          email: emailInput.value,
          display_name: displayNameInput.value,
          password: passwordInput.value
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        this.hideAuthModal();
        this.updateAuthUI();

        if (window.notifications && typeof window.notifications.initSSE === 'function') {
          window.notifications.initSSE();
        }

        window.showToast?.('회원가입 및 로그인에 성공했습니다.', 'success');
        
        window.app?.router();
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.error || '회원가입에 실패했습니다.';
        }
      }
    },

    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (window.notifications && typeof window.notifications.closeSSE === 'function') {
        window.notifications.closeSSE();
      }

      this.updateAuthUI();
      window.showToast?.('로그아웃 되었습니다.', 'info');
      window.location.hash = '#/';
      window.app?.router();
    },

    updateAuthUI() {
      const loggedInElements = document.querySelectorAll('.logged-in');
      const loggedOutElements = document.querySelectorAll('.logged-out');
      const adminElements = document.querySelectorAll('.admin-only');
      const userAvatarBtn = document.getElementById('user-avatar-btn');
      const user = this.getCurrentUser();

      if (this.isLoggedIn() && user) {
        loggedInElements.forEach(el => el.classList.remove('hidden'));
        loggedOutElements.forEach(el => el.classList.add('hidden'));

        if (user.role === 'admin') {
          adminElements.forEach(el => el.classList.remove('hidden'));
        } else {
          adminElements.forEach(el => el.classList.add('hidden'));
        }

        if (userAvatarBtn) {
          userAvatarBtn.textContent = user.display_name ? user.display_name.substring(0, 1).toUpperCase() : 'U';
        }
      } else {
        loggedInElements.forEach(el => el.classList.add('hidden'));
        loggedOutElements.forEach(el => el.classList.remove('hidden'));
        adminElements.forEach(el => el.classList.add('hidden'));
      }
    }
  };

  window.auth = auth;
})();
