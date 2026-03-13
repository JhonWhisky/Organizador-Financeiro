import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Container, Typography, Box, Paper, ThemeProvider, createTheme, CssBaseline, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import Dashboard from './components/Dashboard/Dashboard';
import SalariosList from './components/Salarios/SalariosList';
import AssinaturasList from './components/Assinaturas/AssinaturasList';
import FaturasList from './components/Faturas/FaturasList';
import PixList from './components/Pix/PixList';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login/Login';

// Este componente protege a visualização. Só mostra o painel se houver utilizador logado.
function MainContent({ toggleColorMode, mode }) {
  const { usuario, logout, carregando } = useContext(AuthContext);

  if (carregando) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><Typography>A carregar...</Typography></Box>;

  // Se não estiver logado, tranca o utilizador no ecrã de Login
  if (!usuario) {
    return (
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <IconButton onClick={toggleColorMode} color="inherit">{mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}</IconButton>
        </Box>
        <Login />
      </Box>
    );
  }

  // Se estiver logado, liga a base de dados (FinanceProvider) e mostra tudo!
  return (
    <FinanceProvider>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Organizador Financeiro
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                Logado como: {usuario.email}
              </Typography>
              <IconButton onClick={toggleColorMode} color="inherit" title="Alternar Tema">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <IconButton onClick={logout} color="error" title="Sair da Conta">
                <LogoutIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mb: 5 }}><Dashboard /></Box>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}><Typography variant="h6" gutterBottom>Gerenciador de Salários</Typography><SalariosList /></Paper>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}><Typography variant="h6" gutterBottom>Gerenciador de PIX (Transferências)</Typography><PixList /></Paper>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}><Typography variant="h6" gutterBottom>Gerenciador de Assinaturas</Typography><AssinaturasList /></Paper>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}><Typography variant="h6" gutterBottom>Gerenciador de Faturas</Typography><FaturasList /></Paper>
        </Box>
      </Container>
    </FinanceProvider>
  );
}

function App() {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode : 'light';
  });

  useEffect(() => { localStorage.setItem('themeMode', mode); }, [mode]);

  const toggleColorMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'dark' ? { background: { default: '#121212', paper: '#1e1e1e' } } : { background: { default: '#f5f5f5', paper: '#ffffff' } }),
    },
  }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> 
      {/* O AuthProvider envolve tudo para distribuir o estado do Login */}
      <AuthProvider>
        <MainContent toggleColorMode={toggleColorMode} mode={mode} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;