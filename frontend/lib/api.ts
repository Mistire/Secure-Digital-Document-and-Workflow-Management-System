import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized (Token expired?)
    // Could implement refresh logic here if Refresh Token is stored
    if (error.response?.status === 401) {
       // Optional: Redirect to login or try refresh
       // For now, simple clear and reject
       Cookies.remove('access_token');
       if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
           window.location.href = '/login';
       }
    }
    return Promise.reject(error);
  }
);

export default api;
