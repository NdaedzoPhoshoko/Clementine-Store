// Simple auth storage utility for tokens and user details
const USER_KEY = 'auth:user';
const ACCESS_TOKEN_KEY = 'auth:accessToken';
const TOKEN_KEY = 'auth:token';

export const authStorage = {
  setAuth({ user, token, accessToken } = {}) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (typeof token === 'string') localStorage.setItem(TOKEN_KEY, token);
    if (typeof accessToken === 'string') localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  setTokens({ token, accessToken } = {}) {
    if (typeof token === 'string') localStorage.setItem(TOKEN_KEY, token);
    if (typeof accessToken === 'string') localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  getAccessToken() { return localStorage.getItem(ACCESS_TOKEN_KEY) || null; },
  getToken() { return localStorage.getItem(TOKEN_KEY) || null; },
  clear() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
  isAuthenticated() { return !!localStorage.getItem(ACCESS_TOKEN_KEY); },
};

export default authStorage;