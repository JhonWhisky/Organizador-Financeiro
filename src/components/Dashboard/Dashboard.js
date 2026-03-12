import React, { useContext } from "react";
import { FinanceContext } from "../../context/FinanceContext";
import {
  Box, Grid, Paper, Typography, Divider, List, ListItem, ListItemText, useTheme
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

export default function Dashboard() {
  // NOVO: Puxamos os "pagamentos" do contexto para os somar às receitas
  const { salarios, assinaturas, faturas, pagamentos } = useContext(FinanceContext);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth();
  const anoAtual = dataAtual.getFullYear();
  const mesesStr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const mesesStrCompletos = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // --- 1. Cálculos do Mês Atual ---
  // Soma todos os pagamentos feitos neste mês específico
  const totalPagamentosMes = pagamentos
    .filter(p => p.mes === mesAtual && p.ano === anoAtual)
    .reduce((acc, curr) => acc + curr.valor, 0);

  // Receitas = Salários + Pagamentos de Acertos recebidos no mês
  const totalReceitas = salarios.reduce((acc, curr) => acc + curr.valor, 0) + totalPagamentosMes;

  let totalAssinaturas = 0;
  let totalParcelasFaturas = 0;
  const despesasPorPessoa = {};
  
  // Array para guardar as despesas totais de cada um dos 12 meses do ano (Para o Gráfico de Linha)
  const historicoMeses = Array.from({ length: 12 }, () => 0);

  const inicializarPessoa = (nome) => { if (!despesasPorPessoa[nome]) despesasPorPessoa[nome] = 0; };

  faturas.forEach(fatura => {
    // Processar Compras Parceladas
    fatura.itens.forEach(item => {
      const [anoCompra, mesCompra, diaCompra] = item.data.split('-').map(Number);
      let mesFatura = mesCompra - 1; let anoFatura = anoCompra;
      if (diaCompra >= fatura.dataFechamento) { mesFatura++; if (mesFatura > 11) { mesFatura = 0; anoFatura++; } }
      
      const valorParcela = item.valorTotal / item.vezes;
      
      for (let i = 0; i < item.vezes; i++) {
        let mesParcela = mesFatura + i; let anoParcela = anoFatura + Math.floor(mesParcela / 12); mesParcela = mesParcela % 12;
        
        // Acumular no gráfico de linha se for do ano atual
        if (anoParcela === anoAtual) {
          historicoMeses[mesParcela] += valorParcela;
        }

        // Acumular no gráfico de anel e totais apenas se for do mês atual
        if (anoParcela === anoAtual && mesParcela === mesAtual) {
          totalParcelasFaturas += valorParcela;
          const resp = item.responsavel || 'Não Informado';
          inicializarPessoa(resp);
          despesasPorPessoa[resp] += valorParcela;
        }
      }
    });

    // Processar Assinaturas
    assinaturas.filter(a => a.fatura === fatura.nome).forEach(ass => {
      // Adiciona o valor da assinatura em todos os meses do ano atual até ao mês atual (para histórico)
      for (let i = 0; i <= mesAtual; i++) {
        historicoMeses[i] += ass.valor;
      }
      // Adiciona aos cálculos do mês atual
      totalAssinaturas += ass.valor;
      const resp = ass.responsavel || 'Não Informado';
      inicializarPessoa(resp);
      despesasPorPessoa[resp] += ass.valor;
    });
  });

  const totalDespesas = totalAssinaturas + totalParcelasFaturas;
  const saldoFinal = totalReceitas - totalDespesas;

  // --- 2. Dados Formatados para o Recharts ---
  const dataBalanco = [
    { name: 'Mês Atual', Receitas: totalReceitas, Despesas: totalDespesas }
  ];

  const dataDonut = Object.keys(despesasPorPessoa).map(nome => ({
    name: nome, value: despesasPorPessoa[nome]
  }));

  const dataLinha = mesesStr.map((mes, index) => ({
    name: mes,
    Despesas: historicoMeses[index]
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#f50057'];
  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
        Resumo de {mesesStrCompletos[mesAtual]} de {anoAtual}
      </Typography>

      {/* --- CARTÕES DO TOPO --- */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: "flex", alignItems: "center", bgcolor: isDark ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9', color: isDark ? '#81c784' : '#2e7d32' }}>
            <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="subtitle2" textTransform="uppercase" fontWeight="bold">Receitas (Salários + Acertos)</Typography>
              <Typography variant="h5" fontWeight="bold">{formatarMoeda(totalReceitas)}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: "flex", alignItems: "center", bgcolor: isDark ? 'rgba(244, 67, 54, 0.1)' : '#ffebee', color: isDark ? '#e57373' : '#c62828' }}>
            <TrendingDownIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="subtitle2" textTransform="uppercase" fontWeight="bold">Despesas do Mês</Typography>
              <Typography variant="h5" fontWeight="bold">{formatarMoeda(totalDespesas)}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: "flex", alignItems: "center", bgcolor: saldoFinal >= 0 ? (isDark ? 'rgba(33, 150, 243, 0.1)' : '#e3f2fd') : (isDark ? 'rgba(255, 152, 0, 0.1)' : '#fff3e0'), color: saldoFinal >= 0 ? (isDark ? '#64b5f6' : '#1565c0') : (isDark ? '#ffb74d' : '#e65100') }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="subtitle2" textTransform="uppercase" fontWeight="bold">Saldo Restante</Typography>
              <Typography variant="h5" fontWeight="bold">{formatarMoeda(saldoFinal)}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* --- GRÁFICOS --- */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        
        {/* Gráfico 1: Barras (Receitas vs Despesas) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: isDark ? 'background.paper' : '#fff', height: '100%', width: '52rem' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Balanço do Mês</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataBalanco} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#e0e0e0'} vertical={false} />
                <XAxis dataKey="name" stroke={isDark ? '#ccc' : '#555'} />
                <YAxis stroke={isDark ? '#ccc' : '#555'} tickFormatter={(value) => `R$ ${value}`} />
                <RechartsTooltip formatter={(value) => formatarMoeda(value)} contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', color: isDark ? '#fff' : '#000' }} />
                <Legend />
                <Bar dataKey="Receitas" fill={isDark ? '#81c784' : '#4caf50'} radius={[4, 4, 0, 0]} barSize={50} />
                <Bar dataKey="Despesas" fill={isDark ? '#e57373' : '#f44336'} radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico 2: Donut (Divisão por Pessoa) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: isDark ? 'background.paper' : '#fff', height: '100%', width: '52rem' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Quem gasta mais? (Despesas)</Typography>
            <Divider sx={{ mb: 2 }} />
            {dataDonut.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dataDonut} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={isDark ? { stroke: '#ccc' } : true}>
                    {dataDonut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatarMoeda(value)} contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', color: isDark ? '#fff' : '#000' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Nenhuma despesa registada neste mês.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Gráfico 3: NOVO - Linha Temporal (Evolução Anual) */}
        <Grid item xs={12} md={12}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: isDark ? 'background.paper' : '#fff', width: '52rem' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Evolução de Despesas em {anoAtual}</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataLinha} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#e0e0e0'} vertical={false} />
                <XAxis dataKey="name" stroke={isDark ? '#ccc' : '#555'} />
                <YAxis stroke={isDark ? '#ccc' : '#555'} tickFormatter={(value) => `R$ ${value}`} />
                <RechartsTooltip formatter={(value) => formatarMoeda(value)} contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', color: isDark ? '#fff' : '#000' }} />
                <Legend />
                <Line type="monotone" name="Total Despesas (Mês)" dataKey="Despesas" stroke="#f44336" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
      </Grid>
    </Box>
  );
}