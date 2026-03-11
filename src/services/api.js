import axios from 'axios';

// Quando fizermos o deploy, o Vercel vai disponibilizar a API no mesmo domínio, mas sob a rota /api
const isProduction = process.env.NODE_ENV === 'production';

const api = axios.create({
  baseURL: isProduction ? '/api' : 'http://localhost:3001',
});

export default api;