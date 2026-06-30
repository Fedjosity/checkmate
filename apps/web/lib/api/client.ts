import axios from 'axios';
import { getFirebaseToken } from '@/lib/firebase/auth';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getFirebaseToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) window.location.href = '/login';
    return Promise.reject(err.response?.data ?? err);
  }
);
