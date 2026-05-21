const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    // SSE endpoint has no JSON response directly or requires special handling,
    // but standard APIs return JSON.
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw { status: response.status, ...data };
    }
    return data;
  } catch (error) {
    if (error.status === 401) {
      // Token expired or invalid, logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.auth && typeof window.auth.updateAuthUI === 'function') {
        window.auth.updateAuthUI();
      }
    }
    throw error;
  }
}

// Convenience methods
const api = {
  get: (url) => apiRequest(url),
  post: (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => apiRequest(url, { method: 'DELETE' })
};

window.api = api;
