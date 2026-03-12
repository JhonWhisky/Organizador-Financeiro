import React, { useState, useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import api from '../../services/api';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography, Chip,
  FormControl, InputLabel, Select, MenuItem, useTheme, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PixIcon from '@mui/icons-material/Pix';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PixList() {
  const { pix, setPix, responsaveis, setResponsaveis } = useContext(FinanceContext);
  const theme = useTheme(); 
  const isDark = theme.palette.mode === 'dark';

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const mesesStr = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const mudarMes = (direcao) => {
    let novoMes = mesSelecionado + direcao; let novoAno = anoSelecionado;
    if (novoMes > 11) { novoMes = 0; novoAno++; }
    if (novoMes < 0) { novoMes = 11; novoAno--; }
    setMesSelecionado(novoMes); setAnoSelecionado(novoAno);
  };

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, data: '', destinatario: '', valor: '', descricao: '', responsavelId: '' });

  // Filtrar os PIX apenas do mês selecionado
  const pixDoMes = pix.filter(p => {
    if (!p.data) return false;
    const [ano, mes] = p.data.split('-').map(Number);
    return ano === anoSelecionado && (mes - 1) === mesSelecionado;
  }).sort((a, b) => a.data.localeCompare(b.data));

  const totalPixMes = pixDoMes.reduce((acc, curr) => acc + curr.valor, 0);

  const handleOpen = (item = null) => {
    if (item) {
      const respEncontrado = responsaveis.find(r => r.nome === item.responsavel);
      setFormData({ 
        id: item.id, data: item.data, destinatario: item.destinatario, valor: item.valor, descricao: item.descricao,
        responsavelId: respEncontrado ? respEncontrado.id : '' 
      });
      setIsEditing(true);
    } else {
      setFormData({ id: null, data: '', destinatario: '', valor: '', descricao: '', responsavelId: '' });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const recarregarPix = async () => {
    const res = await api.get('/pix');
    setPix(res.data.map(p => ({ ...p, responsavel: p.responsavel ? p.responsavel.nome : 'Não Informado' })));
  };

  const handleSave = async () => {
    const payload = { ...formData, valor: parseFloat(formData.valor) };
    try {
      if (isEditing) { await api.put(`/pix/${formData.id}`, payload); } 
      else { await api.post('/pix', payload); }
      await recarregarPix();
      setOpen(false);
    } catch (error) { alert("Erro ao guardar PIX."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Eliminar este PIX?")) {
      try { await api.delete(`/pix/${id}`); await recarregarPix(); } 
      catch (error) { alert("Erro ao apagar."); }
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const criarNovoResponsavel = async () => {
    const nome = window.prompt("Nome da pessoa (Responsável)?");
    if (!nome) return;
    try {
      const res = await api.post('/responsaveis', { nome });
      setResponsaveis([...responsaveis, res.data]);
      setFormData({ ...formData, responsavelId: res.data.id });
    } catch (error) { alert("Erro ao criar responsável."); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: isDark ? 'rgba(0, 188, 212, 0.1)' : '#e0f7fa', borderRadius: 2 }}>
        <IconButton onClick={() => mudarMes(-1)} color="info"><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" fontWeight="bold" color="info.main">PIX de {mesesStr[mesSelecionado]} de {anoSelecionado}</Typography>
        <IconButton onClick={() => mudarMes(1)} color="info"><ChevronRightIcon /></IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Total PIX no Mês: <Typography component="span" color="error" fontWeight="bold">{formatarMoeda(totalPixMes)}</Typography>
        </Typography>
        <Button variant="contained" color="info" startIcon={<PixIcon />} onClick={() => handleOpen()}>Novo PIX</Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }}>
            <TableRow>
              <TableCell><strong>Data</strong></TableCell>
              <TableCell><strong>Responsável</strong></TableCell>
              <TableCell><strong>Destinatário</strong></TableCell>
              <TableCell><strong>Descrição</strong></TableCell>
              <TableCell align="right"><strong>Valor</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pixDoMes.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.data}</TableCell>
                <TableCell><Chip size="small" label={p.responsavel} /></TableCell>
                <TableCell>{p.destinatario}</TableCell>
                <TableCell>{p.descricao}</TableCell>
                <TableCell align="right"><Typography fontWeight="bold" color="error">{formatarMoeda(p.valor)}</Typography></TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(p)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(p.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {pixDoMes.length === 0 && <TableRow><TableCell colSpan={6} align="center">Nenhum PIX registado neste mês.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Editar PIX' : 'Novo PIX'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Data (YYYY-MM-DD)" name="data" type="date" value={formData.data} onChange={handleChange} fullWidth variant="outlined" InputLabelProps={{ shrink: true }} sx={{ mb: 3, mt: 1 }} />
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Quem pagou? (Responsável)</InputLabel>
              <Select name="responsavelId" value={formData.responsavelId} label="Quem pagou? (Responsável)" onChange={handleChange}>
                {responsaveis.map(resp => (<MenuItem key={resp.id} value={resp.id}>{resp.nome}</MenuItem>))}
              </Select>
            </FormControl>
            <Button variant="outlined" color="primary" onClick={criarNovoResponsavel} sx={{ height: 56 }}><PersonAddIcon /></Button>
          </Box>

          <TextField margin="dense" label="Destinatário (Para quem?)" name="destinatario" value={formData.destinatario} onChange={handleChange} fullWidth variant="outlined" sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={7}><TextField margin="dense" label="Descrição (Opcional)" name="descricao" value={formData.descricao} onChange={handleChange} fullWidth variant="outlined" /></Grid>
            <Grid item xs={5}><TextField margin="dense" label="Valor" name="valor" type="number" value={formData.valor} onChange={handleChange} fullWidth variant="outlined" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="info">Guardar PIX</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}