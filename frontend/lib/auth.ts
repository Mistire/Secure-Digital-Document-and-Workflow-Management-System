import api from './api';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const login = async (username: string, password: string, otp: string = '') => {
  const payload: any = { username, password };
  if (otp) payload.otp = otp;
  
  const response = await api.post('/auth/login/', payload);
  const { access, refresh } = response.data;
  
  // Store tokens
  Cookies.set('access_token', access);
  Cookies.set('refresh_token', refresh);
  
  return jwtDecode(access);
};

export const register = async (userData: any) => {
  const response = await api.post('/auth/register/', userData);
  return response.data;
};

export const logout = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  window.location.href = '/login';
};

export const getUser = () => {
    const token = Cookies.get('access_token');
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch (e) {
        return null;
    }
}

export const isAuthenticated = () => {
    return !!Cookies.get('access_token');
}

export const isAdmin = () => {
    const user: any = getUser();
    return user && (user.is_staff || user.is_superuser);
}

export const googleLogin = async (credential: string) => {
  const response = await api.post('/auth/google/', { credential });
  const { access, refresh } = response.data;
  Cookies.set('access_token', access);
  Cookies.set('refresh_token', refresh);
  return jwtDecode(access);
};
