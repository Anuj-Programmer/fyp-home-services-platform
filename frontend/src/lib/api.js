import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const clearClientSession = () => {
  Cookies.remove('token');
  Cookies.remove('userId');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearClientSession();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
