const USER_KEY = 'auth:user';
const ACCESS_TOKEN_KEY = 'auth:accessToken';
const TOKEN_KEY = 'auth:token';

function decodeJwtPayload(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  const exp = payload && Number(payload.exp);
  if (!exp || !Number.isFinite(exp)) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now;
}

export const authStorage = {
  setAuth({ user, token, accessToken } = {}) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (typeof token === 'string') localStorage.setItem(TOKEN_KEY, token);
    if (typeof accessToken === 'string') localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: this.getUser(), isAuthed: this.isAuthenticated() } })); } catch (_) {}
  },
  setTokens({ token, accessToken } = {}) {
    if (typeof token === 'string') localStorage.setItem(TOKEN_KEY, token);
    if (typeof accessToken === 'string') localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: this.getUser(), isAuthed: this.isAuthenticated() } })); } catch (_) {}
  },
  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: this.getUser(), isAuthed: this.isAuthenticated() } })); } catch (_) {}
  },
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  getAccessToken() {
    const t = localStorage.getItem(ACCESS_TOKEN_KEY) || null;
    if (t && isTokenExpired(t)) return null;
    return t;
  },
  getToken() { return localStorage.getItem(TOKEN_KEY) || null; },
  clear() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null, isAuthed: false } })); } catch (_) {}
  },
  isAuthenticated() {
    const t = localStorage.getItem(ACCESS_TOKEN_KEY);
    return !!t && !isTokenExpired(t);
  },
};

export default authStorage;
