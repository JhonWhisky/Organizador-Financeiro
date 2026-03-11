import React, { useContext } from "react"; // Importar useContext
import { FinanceContext } from "../../context/FinanceContext"; // Importar o contexto
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function Dashboard() {
  const { salarios, assinaturas, faturas } = useContext(FinanceContext);

  // 1. Total de Receitas
  const totalReceitas = salarios.reduce((acc, curr) => acc + curr.valor, 0);

  // 2. Total de Despesas (Assinaturas + Parcelas das Faturas)
  const totalAssinaturas = assinaturas.reduce(
    (acc, curr) => acc + curr.valor,
    0,
  );

  const totalParcelasFaturas = faturas.reduce((accFatura, fatura) => {
    const somaItens = fatura.itens.reduce(
      (accItem, item) => accItem + item.valorTotal / item.vezes,
      0,
    );
    return accFatura + somaItens;
  }, 0);

  const totalDespesas = totalAssinaturas + totalParcelasFaturas;

  // 3. Saldo Final
  const saldoFinal = totalReceitas - totalDespesas;

  // Função auxiliar para formatar moeda
  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Card Receitas */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              bgcolor: "#e8f5e9",
              color: "#2e7d32",
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography
                variant="subtitle2"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Receitas Totais
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatarMoeda(totalReceitas)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card Despesas */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              bgcolor: "#ffebee",
              color: "#c62828",
            }}
          >
            <TrendingDownIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography
                variant="subtitle2"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Despesas (Mês)
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatarMoeda(totalDespesas)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card Saldo */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              bgcolor: saldoFinal >= 0 ? "#e3f2fd" : "#fff3e0",
              color: saldoFinal >= 0 ? "#1565c0" : "#e65100",
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography
                variant="subtitle2"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Saldo Restante
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatarMoeda(saldoFinal)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Detalhamento Rápido */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Resumo de Despesas
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined">
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Total em Assinaturas"
                    secondary="Custo fixo mensal"
                  />
                  <Typography variant="body1" fontWeight="bold" color="error">
                    {formatarMoeda(totalAssinaturas)}
                  </Typography>
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined">
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Total em Parcelas (Cartões)"
                    secondary="Soma das faturas do mês"
                  />
                  <Typography variant="body1" fontWeight="bold" color="error">
                    {formatarMoeda(totalParcelasFaturas)}
                  </Typography>
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
