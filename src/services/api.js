import axios from 'axios';

// Deteta se está a rodar no Vercel (produção) ou no teu PC (desenvolvimento)
const isProduction = process.env.NODE_ENV === 'production';

const api = axios.create({
  // No Vercel, a API fica na mesma rota base, mas dentro da pasta /api
  baseURL: isProduction ? '/api' : 'http://localhost:3001', 
});

export default api;