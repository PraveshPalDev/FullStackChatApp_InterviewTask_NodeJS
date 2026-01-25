import axios from 'axios';
import { API_BASE_URL } from './url';
import { getAuthToken } from '../utils/storage';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  async config => {
    const authToken = getAuthToken();
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

export default axiosClient;
