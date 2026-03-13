import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Container, Paper, Typography, TextField, Button, Alert } from '@mui/material';

export default function Login() {
  const { login, registrar } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      if (isLogin) {
        await login(email, senha);
      } else {
        await registrar(email, senha);
      }
    } catch (error) {
      setErro(error.response?.data?.error || 'Ocorreu um erro de comunicação.');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <Paper elevation={4} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
          {isLogin ? 'Bem-vindo de Volta' : 'Criar Nova Conta'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isLogin ? 'Faz login para gerires as tuas finanças.' : 'Regista-te para acederes ao organizador.'}
        </Typography>

        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField label="Senha" type="password" fullWidth margin="normal" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}>
            {isLogin ? 'Entrar' : 'Registar Conta'}
          </Button>
        </form>

        <Button color="inherit" onClick={() => { setIsLogin(!isLogin); setErro(''); }} sx={{ textTransform: 'none' }}>
          {isLogin ? 'Ainda não tens conta? Clica aqui' : 'Já tens uma conta? Faz Login'}
        </Button>
      </Paper>
    </Container>
  );
}