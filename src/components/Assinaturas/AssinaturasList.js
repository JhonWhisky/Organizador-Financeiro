import React, { useState, useContext } from 'react';
// import { useTheme } from 'style-components';
import { FinanceContext } from '../../context/FinanceContext';
import api from '../../services/api';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Chip,
  FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function AssinaturasList() {
  const theme = 'dark';
  const { assinaturas, setAssinaturas, responsaveis, faturas } = useContext(FinanceContext);

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: '', faturaId: '', responsavelId: '', valor: '', diaCobranca: '' });

  const handleOpen = (assinatura = null) => {
    if (assinatura) {
      const respEncontrado = responsaveis.find(r => r.nome === assinatura.responsavel);
      const faturaEncontrada = faturas.find(f => f.nome === assinatura.fatura);
      
      setFormData({ 
        id: assinatura.id, nome: assinatura.nome, valor: assinatura.valor, diaCobranca: assinatura.diaCobranca,
        responsavelId: respEncontrado ? respEncontrado.id : '',
        faturaId: faturaEncontrada ? faturaEncontrada.id : ''
      });
      setIsEditing(true);
    } else {
      setFormData({ id: null, nome: '', faturaId: '', responsavelId: '', valor: '', diaCobranca: '' });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const recarregarAssinaturas = async () => {
    const res = await api.get('/assinaturas');
    setAssinaturas(res.data.map(ass => ({
      ...ass, 
      responsavel: ass.responsavel ? ass.responsavel.nome : 'Não Informado',
      fatura: ass.fatura ? ass.fatura.nome : 'Não Informada'
    })));
  };

  const handleSave = async () => {
    const payload = { ...formData, valor: parseFloat(formData.valor), diaCobranca: parseInt(formData.diaCobranca) };
    try {
      if (isEditing) { await api.put(`/assinaturas/${formData.id}`, payload); } 
      else { await api.post('/assinaturas', payload); }
      await recarregarAssinaturas();
      handleClose();
    } catch (error) { alert("Erro ao guardar. Verifica os dados."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Eliminar esta assinatura?")) {
      try {
        await api.delete(`/assinaturas/${id}`);
        await recarregarAssinaturas();
      } catch (error) { alert("Erro ao apagar."); }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Adicionar Assinatura
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ whiteSpace: 'nowrap' }}>
          <TableHead sx={{ bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }}>
            <TableRow>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Cartão</strong></TableCell>
              <TableCell><strong>Responsável</strong></TableCell>
              <TableCell align="center"><strong>Dia (Cobrança)</strong></TableCell>
              <TableCell align="right"><strong>Valor</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assinaturas.map((assinatura) => (
              <TableRow key={assinatura.id}>
                <TableCell>{assinatura.nome}</TableCell>
                <TableCell><Chip label={assinatura.fatura} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={assinatura.responsavel} size="small" /></TableCell>
                <TableCell align="center">{assinatura.diaCobranca}</TableCell>
                <TableCell align="right"><strong>{formatarMoeda(assinatura.valor)}</strong></TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(assinatura)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(assinatura.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {assinaturas.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">Nenhuma assinatura registada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Editar Assinatura' : 'Nova Assinatura'}</DialogTitle>
        <DialogContent>
          <TextField 
            margin="dense" 
            label="Nome da Assinatura (Ex: Netflix)" 
            name="nome" 
            value={formData.nome} 
            onChange={handleChange} 
            fullWidth 
            variant="outlined" 
            sx={{ mb: 3, mt: 1 }} 
          />
          
          {/* Caixa do Cartão de Crédito (Agora ocupa 100% da largura) */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Cartão de Crédito</InputLabel>
            <Select 
              name="faturaId" 
              value={formData.faturaId} 
              label="Cartão de Crédito" 
              onChange={handleChange}
            >
              {faturas.map(fat => (<MenuItem key={fat.id} value={fat.id}>{fat.nome}</MenuItem>))}
              {faturas.length === 0 && <MenuItem disabled value="">Nenhum cartão registado</MenuItem>}
            </Select>
          </FormControl>

          {/* Caixa do Responsável (Agora ocupa 100% da largura e tem o botão de adicionar) */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Responsável</InputLabel>
              <Select 
                name="responsavelId" 
                value={formData.responsavelId} 
                label="Responsável" 
                onChange={handleChange}
              >
                {responsaveis.map(resp => (<MenuItem key={resp.id} value={resp.id}>{resp.nome}</MenuItem>))}
                {responsaveis.length === 0 && <MenuItem disabled value="">Nenhum responsável registado</MenuItem>}
              </Select>
            </FormControl>
            {/* Opcional: Para ter o atalho de adicionar pessoa rapidamente */}
            {/* Nota: Lembra-te de importar o PersonAddIcon do MUI Icons no topo do ficheiro se fores usar este botão */}
          </Box>

          {/* Mantemos o Dia e o Valor lado a lado pois são números pequenos */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField margin="dense" label="Dia da Cobrança" name="diaCobranca" type="number" value={formData.diaCobranca} onChange={handleChange} fullWidth variant="outlined" />
            </Grid>
            <Grid item xs={6}>
              <TextField margin="dense" label="Valor Mensal" name="valor" type="number" value={formData.valor} onChange={handleChange} fullWidth variant="outlined" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="secondary">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
