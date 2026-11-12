import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { TOKEN_KEY } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session persistence: on every page load, restore the session from the saved token.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => saveSession((await api.post('/auth/register', payload)).data);
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
