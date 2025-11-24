import { useCallback, useEffect, useState } from 'react';
import authStorage from './authStorage.js';

export default function useAuthUser() {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [isAuthed, setIsAuthed] = useState(() => authStorage.isAuthenticated());

  useEffect(() => {
    const onChange = (e) => {
      const detail = e && e.detail ? e.detail : {};
      const nextUser = typeof detail.user !== 'undefined' ? detail.user : authStorage.getUser();
      const nextAuthed = typeof detail.isAuthed !== 'undefined' ? detail.isAuthed : authStorage.isAuthenticated();
      setUser(nextUser);
      setIsAuthed(nextAuthed);
    };
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === 'auth:user' || e.key === 'auth:accessToken') onChange({});
    };
    window.addEventListener('auth:changed', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth:changed', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const refresh = useCallback(() => {
    setUser(authStorage.getUser());
    setIsAuthed(authStorage.isAuthenticated());
  }, []);

  return { user, isAuthed, refresh };
}