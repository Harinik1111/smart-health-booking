import axios from 'axios';
import { TOKEN_KEY } from '../utils/constants';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expired/invalid while using the app -> clear session and go to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login') && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export default api;
