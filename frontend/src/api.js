let isRefreshing = false;
let refreshQueue = [];

async function doRefresh() {
  const refreshToken = localStorage.getItem('eicRefreshToken');
  if (!refreshToken) throw new Error('No refresh token');
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  localStorage.setItem('eicToken', data.token);
  if (data.refreshToken) localStorage.setItem('eicRefreshToken', data.refreshToken);
  return data.token;
}

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('eicToken');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await doRefresh();
        isRefreshing = false;
        refreshQueue.forEach(cb => cb(newToken));
        refreshQueue = [];
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      } catch (err) {
        isRefreshing = false;
        refreshQueue.forEach(cb => cb(null));
        refreshQueue = [];
        localStorage.removeItem('eicToken');
        localStorage.removeItem('eicRefreshToken');
        localStorage.removeItem('eicUser');
        window.location.href = '/login';
        throw err;
      }
    } else {
      await new Promise(resolve => refreshQueue.push(resolve));
      const newToken = localStorage.getItem('eicToken');
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    }
  }

  return res;
}
