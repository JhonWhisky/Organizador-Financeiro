import React, { useState, useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import api from '../../services/api'; // O nosso cliente Axios
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography, Chip,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function SalariosList() {
  const theme = 'dark';
  const { salarios, setSalarios, faturas, assinaturas, responsaveis, setResponsaveis } = useContext(FinanceContext);

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
  // O estado agora usa "responsavelId" para casar com a base de dados
  const [formData, setFormData] = useState({ id: null, nome: '', responsavelId: '', valor: '' });

  // Funções do CRUD
  const handleOpen = (salario = null) => {
    if (salario) {
      // Procurar o ID do responsável baseado no nome que está na lista
      const respEncontrado = responsaveis.find(r => r.nome === salario.responsavel);
      setFormData({ 
        id: salario.id, 
        nome: salario.nome, 
        responsavelId: respEncontrado ? respEncontrado.id : '', 
        valor: salario.valor 
      });
      setIsEditing(true);
    } else {
      setFormData({ id: null, nome: '', responsavelId: '', valor: '' });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // LIGADO À API REAL
  const handleSave = async () => {
    try {
      if (isEditing) {
        // Atualizar na API
        await api.put(`/salarios/${formData.id}`, formData);
      } else {
        // Criar novo na API
        await api.post('/salarios', formData);
      }
      
      // Recarregar os salários após a alteração para atualizar a tabela
      const res = await api.get('/salarios');
      const salariosFormatados = res.data.map(sal => ({
        ...sal,
        responsavel: sal.responsavel.nome
      }));
      setSalarios(salariosFormatados);
      
      handleClose();
    } catch (error) {
      console.error("Erro ao guardar salário:", error);
      alert("Ocorreu um erro ao guardar. Verifica se todos os campos estão preenchidos.");
    }
  };

  // LIGADO À API REAL
  const handleDelete = async (id) => {
    if (window.confirm('Tens a certeza que queres eliminar este salário?')) {
      try {
        await api.delete(`/salarios/${id}`);
        setSalarios(salarios.filter(s => s.id !== id));
      } catch (error) {
        console.error("Erro ao eliminar:", error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Atalho para criar um responsável rapidamente
  const criarNovoResponsavel = async () => {
    const nome = window.prompt("Qual é o nome da pessoa (Responsável)?");
    if (!nome) return;

    try {
      const res = await api.post('/responsaveis', { nome });
      setResponsaveis([...responsaveis, res.data]);
      // Seleciona-o automaticamente no formulário
      setFormData({ ...formData, responsavelId: res.data.id });
    } catch (error) {
      alert("Erro ao criar responsável. Esse nome já pode existir.");
    }
  };

  // Função para calcular o total de despesas (Mantém-se igual, simulada nas faturas)
  const calcularDespesasPorResponsavel = (nomeResponsavel) => {
    let totalDespesas = 0;
    faturas.forEach(fatura => {
      fatura.itens.forEach(item => {
        if ((item.responsavel || 'Não Informado') === nomeResponsavel) {
          const [anoCompra, mesCompra, diaCompra] = item.data.split('-').map(Number);
          let mesFatura = mesCompra - 1; let anoFatura = anoCompra;
          if (diaCompra >= fatura.dataFechamento) {
            mesFatura++; if (mesFatura > 11) { mesFatura = 0; anoFatura++; }
          }
          const valorParcela = item.valorTotal / item.vezes;
          for (let i = 0; i < item.vezes; i++) {
            let mesParcela = mesFatura + i; let anoParcela = anoFatura + Math.floor(mesParcela / 12);
            mesParcela = mesParcela % 12;
            if (anoParcela === anoSelecionado && mesParcela === mesSelecionado) { totalDespesas += valorParcela; }
          }
        }
      });
    });
    assinaturas.forEach(ass => { if ((ass.responsavel || 'Não Informado') === nomeResponsavel) { totalDespesas += ass.valor; } });
    return totalDespesas;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: theme === 'dark' ? 'rgba(76, 175, 80, 0.1)' : '#d1fae5', borderRadius: 2 }}>
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
        <Table sx={{ whiteSpace: 'nowrap' }}>
          <TableHead sx={{ bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }}>
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
                    <Typography color="error.main" fontWeight="bold">- {formatarMoeda(despesas)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color={valorLiquido >= 0 ? 'success.main' : 'error.main'}>
                      {formatarMoeda(valorLiquido)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpen(salario)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(salario.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {salarios.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">Nenhum salário registado ainda. Cria o primeiro!</TableCell></TableRow>
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
            value={formData.nome} onChange={handleChange} fullWidth variant="outlined" sx={{ mb: 2, mt: 1 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Responsável</InputLabel>
              <Select
                name="responsavelId"
                value={formData.responsavelId}
                label="Responsável"
                onChange={handleChange}
              >
                {responsaveis.map(resp => (
                  <MenuItem key={resp.id} value={resp.id}>{resp.nome}</MenuItem>
                ))}
                {responsaveis.length === 0 && (
                  <MenuItem disabled value="">Nenhum responsável registado</MenuItem>
                )}
              </Select>
            </FormControl>
            <Button variant="outlined" color="primary" onClick={criarNovoResponsavel} sx={{ height: 56 }}>
              <PersonAddIcon />
            </Button>
          </Box>

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