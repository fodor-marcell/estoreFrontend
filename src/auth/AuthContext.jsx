/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  // Real login API call
  const login = async (userName, password) => {
    try {
      const res = await api.post('/public/auth/login', { userName, password });
      const loggedIn = res.data;

      console.log('Response data:', loggedIn);  // DEBUG
      console.log('Token from response:', loggedIn?.token);  // DEBUG

      // TOKEN MENTÉS
      if (loggedIn?.token) {
        localStorage.setItem('token', loggedIn.token);
        console.log('Token saved to localStorage:', localStorage.getItem('token'));  // DEBUG
      } else {
        console.error('No token in response!');
      }

      const id = loggedIn?.id;
      const name = loggedIn?.username ?? loggedIn?.userName ?? userName;
      const role = loggedIn?.role ?? loggedIn?.userRole ?? 'user';

      if (name) {
        const userData = { id: id ?? null, username: name, role };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }

      return { success: false, message: 'Invalid response' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: err?.response?.data?.message || 'Login failed' };
    }
  };

  // Real register API call
  const register = async (username, password) => {
    try {
      const res = await api.post('/public/auth/register', { userName: username, password });
      const created = res.data;
      const id = created?.id;
      const name = created?.userName ?? created?.username;
      const role = created?.role ?? 'user';
      if (id && name) setUser({ id, username: name, role });
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
