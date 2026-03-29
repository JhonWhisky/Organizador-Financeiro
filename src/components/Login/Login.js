import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api'; // Precisamos de chamar a API diretamente para as novas rotas
import { Container, Paper, Typography, TextField, Button, Alert, Box } from '@mui/material';

export default function Login() {
  const { login, registrar } = useContext(AuthContext);
  
  // Fases: 'LOGIN', 'REGISTER', 'FORGOT', 'RESET'
  const [fase, setFase] = useState('LOGIN'); 
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState(''); // Código de 6 dígitos
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');

    try {
      if (fase === 'LOGIN') {
        await login(email, senha);
      } 
      else if (fase === 'REGISTER') {
        await registrar(email, senha);
      } 
      else if (fase === 'FORGOT') {
        // Pede o código de recuperação
        const res = await api.post('/auth/esqueci-senha', { email });
        // Para testes: Mostramos o código no ecrã de sucesso. (Numa app real, dizias só "Verifica o teu e-mail")
        setSucesso(`Simulação: O teu código é ${res.data.codigoParaTeste}`);
        setFase('RESET');
      } 
      else if (fase === 'RESET') {
        // Envia o código e a nova senha
        const res = await api.post('/auth/redefinir-senha', { email, codigo, novaSenha: senha });
        setSucesso(res.data.message);
        setSenha(''); setCodigo('');
        setFase('LOGIN'); // Volta para o login para ele entrar com a nova senha
      }
    } catch (error) {
      setErro(error.response?.data?.error || 'Ocorreu um erro de comunicação.');
    }
  };

  // Textos dinâmicos baseados na fase atual
  const titulos = {
    LOGIN: 'Bem-vindo de Volta',
    REGISTER: 'Criar Nova Conta',
    FORGOT: 'Recuperar Senha',
    RESET: 'Criar Nova Senha'
  };

  const descricoes = {
    LOGIN: 'Faz login para gerires as tuas finanças.',
    REGISTER: 'Regista-te para acederes ao organizador.',
    FORGOT: 'Digita o teu e-mail para receberes um código de recuperação.',
    RESET: 'Digita o código de 6 dígitos e a tua nova senha.'
  };

  return (
    <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <Paper elevation={4} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
          {titulos[fase]}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {descricoes[fase]}
        </Typography>

        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        {sucesso && <Alert severity="success" sx={{ mb: 2 }}>{sucesso}</Alert>}

        <form onSubmit={handleSubmit}>
          
          {/* Email aparece em todas as fases */}
          <TextField 
            label="Email" type="email" fullWidth margin="normal" 
            value={email} onChange={(e) => setEmail(e.target.value)} 
            disabled={fase === 'RESET'} // Bloqueia o email na fase final para não haver enganos
            required 
          />
          
          {/* Fase de Recuperação: Pede o Código */}
          {fase === 'RESET' && (
            <TextField 
              label="Código de 6 dígitos" type="text" fullWidth margin="normal" 
              value={codigo} onChange={(e) => setCodigo(e.target.value)} required 
            />
          )}

          {/* Senha aparece no Login, Registo e Redefinição (Não aparece no Pedido de Código) */}
          {fase !== 'FORGOT' && (
            <TextField 
              label={fase === 'RESET' ? 'Nova Senha' : 'Senha'} 
              type="password" fullWidth margin="normal" 
              value={senha} onChange={(e) => setSenha(e.target.value)} required 
            />
          )}
          
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}>
            {fase === 'LOGIN' ? 'Entrar' : fase === 'REGISTER' ? 'Registar Conta' : fase === 'FORGOT' ? 'Receber Código' : 'Redefinir Senha'}
          </Button>
        </form>

        {/* Botões de Navegação entre Fases */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {fase === 'LOGIN' && (
            <>
              <Button color="inherit" onClick={() => { setFase('FORGOT'); setErro(''); setSucesso(''); }} sx={{ textTransform: 'none' }}>
                Esqueceste-te da senha?
              </Button>
              <Button color="inherit" onClick={() => { setFase('REGISTER'); setErro(''); setSucesso(''); }} sx={{ textTransform: 'none' }}>
                Ainda não tens conta? Clica aqui
              </Button>
            </>
          )}

          {(fase === 'REGISTER' || fase === 'FORGOT' || fase === 'RESET') && (
            <Button color="inherit" onClick={() => { setFase('LOGIN'); setErro(''); setSucesso(''); }} sx={{ textTransform: 'none' }}>
              Voltar ao Login
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}