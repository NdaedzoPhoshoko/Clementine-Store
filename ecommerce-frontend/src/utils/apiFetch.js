import authStorage from '../hooks/use_auth/authStorage.js';

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';

let isRefreshing = false;
let waiters = [];

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve) => waiters.push(resolve));
  }
  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { accept: '*/*' },
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.accessToken) {
      waiters.forEach((resume) => resume(null));
      waiters = [];
      throw new Error(data?.message || 'Refresh failed');
    }
    authStorage.setTokens({ accessToken: data.accessToken, token: data.token });
    waiters.forEach((resume) => resume(data.accessToken));
    waiters = [];
    return data.accessToken;
  } finally {
    isRefreshing = false;
  }
}

function buildAttemptUrls(pathOrUrl) {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  if (isAbsolute) return [pathOrUrl];
  if (pathOrUrl.startsWith('/api/')) {
    return [pathOrUrl, `${API_BASE_URL}${pathOrUrl}`];
  }
  return [pathOrUrl];
}

export async function apiFetch(pathOrUrl, options = {}) {
  const urls = buildAttemptUrls(pathOrUrl);
  const originalHeaders = options.headers || {};
  const token = authStorage.getAccessToken();
  let headers = { ...originalHeaders };
  if (token && !originalHeaders.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const doFetch = async (url, opts = {}) => fetch(url, { ...options, ...opts, headers });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    let res = await doFetch(url);
    if (res.status === 401 && !options.__retry) {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers = { ...headers, Authorization: `Bearer ${newToken}` };
          res = await doFetch(url, { __retry: true });
        }
      } catch (_) {
        // leave res as 401
      }
    }
    if (res.status !== 404 || i === urls.length - 1) {
      return res;
    }
  }
}

export default apiFetch;