import React, { useState, useMemo, useEffect } from 'react';
import { Container, Typography, Box, Paper, ThemeProvider, createTheme, CssBaseline, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Ícone de Lua
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Ícone de Sol
import Dashboard from './components/Dashboard/Dashboard';
import SalariosList from './components/Salarios/SalariosList';
import AssinaturasList from './components/Assinaturas/AssinaturasList';
import FaturasList from './components/Faturas/FaturasList';
import PixList from './components/Pix/PixList';
import { FinanceProvider } from './context/FinanceContext';

function App() {
  // 1. Puxa o tema guardado no localStorage ou assume 'light' como padrão
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode : 'light';
  });

  // 2. Salva no localStorage sempre que o tema mudar
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // 3. Função para alternar o tema
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // 4. Criação do Tema do Material UI
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'dark' ? {
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
          } : {
            background: {
              default: '#f5f5f5',
              paper: '#ffffff',
            },
          }),
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline aplica a cor de fundo global (default) baseada no tema */}
      <CssBaseline /> 
      <FinanceProvider>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            
            {/* NOVO: Cabeçalho com o Título e o Botão de Tema lado a lado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Organizador Financeiro
              </Typography>
              <IconButton onClick={toggleColorMode} color="inherit" title="Alternar Tema">
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>

            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Visão Geral do Mês
              </Typography>
              <Dashboard />
            </Box>
            
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Gerenciador de Salários</Typography>
              <SalariosList />
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Gerenciador de PIX (Transferências)</Typography>
              <PixList />
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Gerenciador de Assinaturas</Typography>
              <AssinaturasList />
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Gerenciador de Faturas</Typography>
              <FaturasList />
            </Paper>
          </Box>
        </Container>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;