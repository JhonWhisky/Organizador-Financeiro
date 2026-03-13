import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verifica se já estavas logado quando a página carrega
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) {
      setUsuario({ email });
    }
    setCarregando(false);
  }, []);

  const login = async (email, senha) => {
    const res = await api.post('/auth/login', { email, senha });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('email', res.data.email);
    setUsuario({ email: res.data.email });
  };

  const registrar = async (email, senha) => {
    await api.post('/auth/registrar', { email, senha });
    await login(email, senha); // Faz login automático após criar a conta
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}