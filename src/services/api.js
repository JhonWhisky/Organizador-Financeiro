import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';

const api = axios.create({
  baseURL: isProduction ? '/api' : 'http://localhost:3001', 
});

// NOVO: Injeta o Token de Segurança em todos os pedidos que saem do React
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;