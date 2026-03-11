import React, { useState, useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function SalariosList() {
  const { salarios, setSalarios, faturas, assinaturas } = useContext(FinanceContext);

  // Estados do Histórico de Meses
  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const mesesStr = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const mudarMes = (direcao) => {
    let novoMes = mesSelecionado + direcao;
    let novoAno = anoSelecionado;
    if (novoMes > 11) { novoMes = 0; novoAno++; }
    if (novoMes < 0) { novoMes = 11; novoAno--; }
    setMesSelecionado(novoMes); setAnoSelecionado(novoAno);
  };

  // Estados do Modal
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: '', responsavel: '', valor: '' });

  // Funções do CRUD de Salários
  const handleOpen = (salario = null) => {
    if (salario) {
      setFormData({ ...salario });
      setIsEditing(true);
    } else {
      setFormData({ id: null, nome: '', responsavel: '', valor: '' });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    if (isEditing) {
      setSalarios(salarios.map(s => (s.id === formData.id ? { ...formData, valor: parseFloat(formData.valor) } : s)));
    } else {
      const novoSalario = { ...formData, id: Date.now(), valor: parseFloat(formData.valor) };
      setSalarios([...salarios, novoSalario]);
    }
    handleClose();
  };

  const handleDelete = (id) => {
    setSalarios(salarios.filter(s => s.id !== id));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para calcular o total de despesas de um responsável no mês selecionado
  const calcularDespesasPorResponsavel = (nomeResponsavel) => {
    let totalDespesas = 0;

    // 1. Somar compras parceladas das faturas
    faturas.forEach(fatura => {
      fatura.itens.forEach(item => {
        if ((item.responsavel || 'Não Informado') === nomeResponsavel) {
          const [anoCompra, mesCompra, diaCompra] = item.data.split('-').map(Number);
          let mesFatura = mesCompra - 1;
          let anoFatura = anoCompra;

          if (diaCompra >= fatura.dataFechamento) {
            mesFatura++;
            if (mesFatura > 11) { mesFatura = 0; anoFatura++; }
          }

          const valorParcela = item.valorTotal / item.vezes;

          for (let i = 0; i < item.vezes; i++) {
            let mesParcela = mesFatura + i;
            let anoParcela = anoFatura + Math.floor(mesParcela / 12);
            mesParcela = mesParcela % 12;

            if (anoParcela === anoSelecionado && mesParcela === mesSelecionado) {
              totalDespesas += valorParcela;
            }
          }
        }
      });
    });

    // 2. Somar assinaturas mensais
    assinaturas.forEach(ass => {
      if ((ass.responsavel || 'Não Informado') === nomeResponsavel) {
        totalDespesas += ass.valor;
      }
    });

    return totalDespesas;
  };

  return (
    <Box>
      {/* Navegador de Histórico */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
        <IconButton onClick={() => mudarMes(-1)} color="success"><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" fontWeight="bold" color="success.main">
          Balanço de Salários - {mesesStr[mesSelecionado]} de {anoSelecionado}
        </Typography>
        <IconButton onClick={() => mudarMes(1)} color="success"><ChevronRightIcon /></IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Adicionar Salário
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f0f0f0' }}>
            <TableRow>
              <TableCell><strong>Nome da Renda</strong></TableCell>
              <TableCell><strong>Responsável</strong></TableCell>
              <TableCell align="right"><strong>Valor Bruto</strong></TableCell>
              <TableCell align="right"><strong>Despesas no Mês</strong></TableCell>
              <TableCell align="right"><strong>Valor Líquido</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salarios.map((salario) => {
              const despesas = calcularDespesasPorResponsavel(salario.responsavel);
              const valorLiquido = salario.valor - despesas;

              return (
                <TableRow key={salario.id}>
                  <TableCell>{salario.nome}</TableCell>
                  <TableCell><Chip size="small" label={salario.responsavel} /></TableCell>
                  <TableCell align="right">{formatarMoeda(salario.valor)}</TableCell>
                  <TableCell align="right">
                    <Typography color="error.main" fontWeight="bold">
                      - {formatarMoeda(despesas)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      fontWeight="bold" 
                      color={valorLiquido >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatarMoeda(valorLiquido)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpen(salario)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(salario.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {salarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">Nenhum salário registado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para Adicionar/Editar */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Editar Salário' : 'Novo Salário'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense" label="Nome do Salário (Ex: Fixo, Renda Extra)" name="nome"
            value={formData.nome} onChange={handleChange} fullWidth variant="outlined"
          />
          <TextField
            margin="dense" label="Responsável (Deve ser igual ao das compras)" name="responsavel"
            value={formData.responsavel} onChange={handleChange} fullWidth variant="outlined"
          />
          <TextField
            margin="dense" label="Valor Bruto" name="valor" type="number"
            value={formData.valor} onChange={handleChange} fullWidth variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="success">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}