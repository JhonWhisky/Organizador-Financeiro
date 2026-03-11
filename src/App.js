import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import Dashboard from './components/Dashboard/Dashboard';
import SalariosList from './components/Salarios/SalariosList';
import AssinaturasList from './components/Assinaturas/AssinaturasList';
import FaturasList from './components/Faturas/FaturasList';
import { FinanceProvider } from './context/FinanceContext'; // Importar o Provider

function App() {
  return (
    <FinanceProvider> {/* Envolver toda a app aqui */}
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold" sx={{ mb: 4 }}>
            Organizador Financeiro
          </Typography>

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
  );
}

export default App;