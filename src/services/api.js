import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // O endereço da tua API Node.js
});

export default api;