import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null); // null = ещё проверяем

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuth(false);
      return;
    }
    // Проверяем токен на сервере
    fetch('http://localhost:8000/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setIsAuth(res.ok))
      .catch(() => setIsAuth(false));
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
  };

  return { isAuth, login, logout };
};