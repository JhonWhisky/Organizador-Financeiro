import React, { useState, useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import api from '../../services/api';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography, Collapse, Chip, Grid, Divider,
  FormControl, InputLabel, Select, MenuItem, useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const obterItensDoMes = (fatura, assinaturas, mes, ano) => {
  const itensNoMes = []; let totalFaturaMes = 0; let totalDevidoGeral = 0;

  fatura.itens.forEach(item => {
    const [anoCompra, mesCompra, diaCompra] = item.data.split('-').map(Number);
    let mesFatura = mesCompra - 1; let anoFatura = anoCompra;
    if (diaCompra >= fatura.dataFechamento) { mesFatura++; if (mesFatura > 11) { mesFatura = 0; anoFatura++; } }
    const valorParcela = item.valorTotal / item.vezes;
    for (let i = 0; i < item.vezes; i++) {
      let mesParcela = mesFatura + i; let anoParcela = anoFatura + Math.floor(mesParcela / 12); mesParcela = mesParcela % 12;
      const hoje = new Date();
      if (anoParcela > hoje.getFullYear() || (anoParcela === hoje.getFullYear() && mesParcela >= hoje.getMonth())) { totalDevidoGeral += valorParcela; }
      if (anoParcela === ano && mesParcela === mes) {
        itensNoMes.push({ ...item, idRender: `${item.id}-${i}`, parcelaAtual: i + 1, valorExibicao: valorParcela, isAssinatura: false });
        totalFaturaMes += valorParcela;
      }
    }
  });

  assinaturas.filter(a => a.fatura === fatura.nome).forEach(ass => {
    itensNoMes.push({ id: ass.id, idRender: `ass-${ass.id}-${mes}-${ano}`, data: `${ano}-${String(mes + 1).padStart(2, '0')}-${String(ass.diaCobranca || 1).padStart(2, '0')}`, nome: ass.nome, tipo: 'Assinatura', vezes: 1, parcelaAtual: 1, valorExibicao: ass.valor, isAssinatura: true, responsavel: ass.responsavel || 'Não Informado' });
    totalFaturaMes += ass.valor; totalDevidoGeral += ass.valor;
  });

  itensNoMes.sort((a, b) => a.data.localeCompare(b.data));
  const limiteDisponivel = (fatura.limite || 0) - totalDevidoGeral;
  return { itensNoMes, totalFaturaMes, limiteDisponivel };
};

function LinhaFatura({ fatura, mesSelecionado, anoSelecionado, onEditFatura, onDeleteFatura, onAddItem, onEditItem, onDeleteItem }) {
  const [open, setOpen] = useState(false);
  const { assinaturas } = useContext(FinanceContext);
  const resumo = obterItensDoMes(fatura, assinaturas, mesSelecionado, anoSelecionado);
  const theme = useTheme(); const isDark = theme.palette.mode === 'dark';

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: open ? (isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5') : 'inherit' }}>
        <TableCell><IconButton size="small" onClick={() => setOpen(!open)}>{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton></TableCell>
        <TableCell component="th" scope="row"><Typography variant="subtitle2" fontWeight="bold">{fatura.nome}</Typography><Typography variant="caption" color="text.secondary">Vence dia {fatura.dataVencimento}</Typography></TableCell>
        <TableCell align="right">{formatarMoeda(fatura.limite || 0)}</TableCell>
        <TableCell align="right"><Chip label={formatarMoeda(resumo.limiteDisponivel)} color={resumo.limiteDisponivel < 0 ? 'error' : 'success'} variant="outlined" size="small" /></TableCell>
        <TableCell align="right"><Typography fontWeight="bold" color="error">{formatarMoeda(resumo.totalFaturaMes)}</Typography></TableCell>
        <TableCell align="center">
          <IconButton color="primary" onClick={() => onEditFatura(fatura)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDeleteFatura(fatura.id)}><DeleteIcon /></IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, border: '1px solid', borderColor: isDark ? '#444' : '#e0e0e0', borderRadius: 2, bgcolor: isDark ? 'background.default' : '#fafafa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Lançamentos da Fatura</Typography>
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => onAddItem(fatura.id)}>Nova Compra</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Responsável</TableCell>
                    <TableCell align="center">Parcela</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumo.itensNoMes.map((item) => (
                    <TableRow key={item.idRender} sx={{ bgcolor: item.isAssinatura ? (isDark ? 'rgba(156, 39, 176, 0.1)' : '#f3e5f5') : 'inherit' }}>
                      <TableCell>{item.data}</TableCell>
                      <TableCell><Box sx={{ display: 'flex', alignItems: 'center' }}>{item.isAssinatura && <AutorenewIcon fontSize="small" color="secondary" sx={{ mr: 1 }} />}<Typography variant="body2">{item.nome}</Typography></Box></TableCell>
                      <TableCell><Chip size="small" label={item.responsavel || 'Não Informado'} /></TableCell>
                      <TableCell align="center">{item.isAssinatura ? '-' : `${item.parcelaAtual}/${item.vezes}`}</TableCell>
                      <TableCell align="right"><strong>{formatarMoeda(item.valorExibicao)}</strong></TableCell>
                      <TableCell align="center">
                        {!item.isAssinatura ? (
                          <>
                            <IconButton size="small" color="primary" onClick={() => onEditItem(fatura.id, item)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => onDeleteItem(fatura.id, item.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </>
                        ) : (<Typography variant="caption" color="text.secondary">Auto</Typography>)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {resumo.itensNoMes.length === 0 && <TableRow><TableCell colSpan={6} align="center">Nenhum lançamento neste mês.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function FaturasList() {
  const { faturas, setFaturas, assinaturas, pagamentos, setPagamentos, responsaveis, setResponsaveis } = useContext(FinanceContext);
  const theme = useTheme(); const isDark = theme.palette.mode === 'dark';

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

  const [openFaturaModal, setOpenFaturaModal] = useState(false);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openPagamentoModal, setOpenPagamentoModal] = useState(false);
  const [isEditingFatura, setIsEditingFatura] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [faturaData, setFaturaData] = useState({ id: null, nome: '', limite: '', dataFechamento: '', dataVencimento: '' });
  const [itemData, setItemData] = useState({ id: null, faturaId: null, data: '', nome: '', tipo: '', vezes: 1, valorTotal: '', responsavelId: '' });
  const [pagamentoData, setPagamentoData] = useState({ responsavelId: '', valor: '' });

  const recarregarFaturas = async () => {
    try { const res = await api.get('/faturas'); setFaturas(res.data.map(fat => ({ ...fat, itens: fat.itens.map(item => ({ ...item, responsavel: item.responsavel ? item.responsavel.nome : 'Não Informado' })) }))); } catch (e) { console.error(e); }
  };

  const handleOpenFatura = (fatura = null) => {
    if (fatura) { setFaturaData({ id: fatura.id, nome: fatura.nome, limite: fatura.limite, dataFechamento: fatura.dataFechamento, dataVencimento: fatura.dataVencimento }); setIsEditingFatura(true); } 
    else { setFaturaData({ id: null, nome: '', limite: '', dataFechamento: '', dataVencimento: '' }); setIsEditingFatura(false); }
    setOpenFaturaModal(true);
  };
  const handleSaveFatura = async () => {
    const payload = { nome: faturaData.nome, limite: parseFloat(faturaData.limite), dataFechamento: parseInt(faturaData.dataFechamento), dataVencimento: parseInt(faturaData.dataVencimento) };
    try { if (isEditingFatura) { await api.put(`/faturas/${faturaData.id}`, payload); } else { await api.post('/faturas', payload); } await recarregarFaturas(); setOpenFaturaModal(false); } catch (error) { alert("Erro ao guardar o cartão."); }
  };
  const handleDeleteFatura = async (id) => { if (window.confirm("Apagar o cartão vai eliminar todas as compras vinculadas. Continuar?")) { try { await api.delete(`/faturas/${id}`); await recarregarFaturas(); } catch (error) { alert("Erro ao apagar cartão."); } } };

  const handleOpenItem = (faturaId, item = null) => {
    if (item) { const respEncontrado = responsaveis.find(r => r.nome === item.responsavel); setItemData({ id: item.id, faturaId, data: item.data, nome: item.nome, tipo: item.tipo, vezes: item.vezes, valorTotal: item.valorTotal, responsavelId: respEncontrado ? respEncontrado.id : '' }); setIsEditingItem(true); } 
    else { setItemData({ id: null, faturaId, data: '', nome: '', tipo: '', vezes: 1, valorTotal: '', responsavelId: '' }); setIsEditingItem(false); }
    setOpenItemModal(true);
  };
  const handleSaveItem = async () => {
    const payload = { data: itemData.data, nome: itemData.nome, tipo: itemData.tipo, vezes: parseInt(itemData.vezes), valorTotal: parseFloat(itemData.valorTotal), faturaId: itemData.faturaId, responsavelId: parseInt(itemData.responsavelId) };
    try { if (isEditingItem) { await api.put(`/itens/${itemData.id}`, payload); } else { await api.post('/itens', payload); } await recarregarFaturas(); setOpenItemModal(false); } catch (error) { alert("Erro ao guardar."); }
  };
  const handleDeleteItem = async (faturaId, itemId) => { if (window.confirm("Eliminar esta compra?")) { try { await api.delete(`/itens/${itemId}`); await recarregarFaturas(); } catch (error) { alert("Erro."); } } };

  const criarNovoResponsavel = async () => { const nome = window.prompt("Nome da pessoa?"); if (!nome) return; try { const res = await api.post('/responsaveis', { nome }); setResponsaveis([...responsaveis, res.data]); setItemData({ ...itemData, responsavelId: res.data.id }); } catch (error) { alert("Erro."); } };

  const calcularAcertoGlobal = () => {
    const divisao = {}; const inicializarDivisao = (resp) => { if (!divisao[resp]) divisao[resp] = { total: 0, pago: 0 }; };
    faturas.forEach(fatura => {
      fatura.itens.forEach(item => {
        const [anoCompra, mesCompra, diaCompra] = item.data.split('-').map(Number);
        let mesFatura = mesCompra - 1; let anoFatura = anoCompra;
        if (diaCompra >= fatura.dataFechamento) { mesFatura++; if (mesFatura > 11) { mesFatura = 0; anoFatura++; } }
        const valorParcela = item.valorTotal / item.vezes;
        for (let i = 0; i < item.vezes; i++) {
          let mesParcela = mesFatura + i; let anoParcela = anoFatura + Math.floor(mesParcela / 12); mesParcela = mesParcela % 12;
          if (anoParcela === anoSelecionado && mesParcela === mesSelecionado) {
            const resp = item.responsavel || 'Não Informado'; inicializarDivisao(resp); divisao[resp].total += valorParcela;
          }
        }
      });
      assinaturas.filter(a => a.fatura === fatura.nome).forEach(ass => { const resp = ass.responsavel || 'Não Informado'; inicializarDivisao(resp); divisao[resp].total += ass.valor; });
    });
    pagamentos.forEach(pag => { if (pag.mes === mesSelecionado && pag.ano === anoSelecionado) { inicializarDivisao(pag.responsavel); divisao[pag.responsavel].pago += pag.valor; } });
    return Object.keys(divisao).map(resp => ({ nome: resp, total: divisao[resp].total, pago: divisao[resp].pago, restante: divisao[resp].total - divisao[resp].pago }));
  };

  const acertoGlobal = calcularAcertoGlobal();

  const handleSavePagamento = async () => {
    try { if (!pagamentoData.responsavelId || !pagamentoData.valor) return; await api.post('/pagamentos', { mes: mesSelecionado, ano: anoSelecionado, valor: parseFloat(pagamentoData.valor), responsavelId: parseInt(pagamentoData.responsavelId) }); const resPagamentos = await api.get('/pagamentos'); setPagamentos(resPagamentos.data.map(pag => ({ ...pag, responsavel: pag.responsavel ? pag.responsavel.nome : 'Não Informado' }))); setOpenPagamentoModal(false); } catch (error) { alert("Erro."); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: isDark ? 'rgba(33, 150, 243, 0.1)' : '#e3f2fd', borderRadius: 2 }}>
        <IconButton onClick={() => mudarMes(-1)} color="primary"><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" fontWeight="bold" color="primary">Faturas de {mesesStr[mesSelecionado]} de {anoSelecionado}</Typography>
        <IconButton onClick={() => mudarMes(1)} color="primary"><ChevronRightIcon /></IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenFatura()}>Adicionar Cartão</Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table sx={{ whiteSpace: 'nowrap' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }}>
              <TableCell />
              <TableCell><strong>Cartão</strong></TableCell>
              <TableCell align="right"><strong>Limite Total</strong></TableCell>
              <TableCell align="right"><strong>Disponível Atual</strong></TableCell>
              <TableCell align="right"><strong>Total da Fatura</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faturas.map((fatura) => (
              <LinhaFatura key={fatura.id} fatura={fatura} mesSelecionado={mesSelecionado} anoSelecionado={anoSelecionado} onEditFatura={handleOpenFatura} onDeleteFatura={handleDeleteFatura} onAddItem={handleOpenItem} onEditItem={handleOpenItem} onDeleteItem={handleDeleteItem} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Painel de Acerto Global - Removido o bgcolor forçado no Paper para obedecer ao tema escuro */}
      <Paper elevation={2} sx={{ p: 3, borderLeft: '5px solid #1976d2' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Acerto de Contas Global</Typography>
          <Button variant="outlined" color="primary" startIcon={<PaymentsIcon />} onClick={() => { setPagamentoData({ responsavelId: '', valor: '' }); setOpenPagamentoModal(true); }}>
            Informar Pagamento
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {acertoGlobal.length > 0 ? acertoGlobal.map((resp) => (
            <Grid item xs={12} sm={6} md={4} key={resp.nome}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: resp.restante <= 0 ? (isDark ? 'rgba(76, 175, 80, 0.1)' : '#f1f8e9') : (isDark ? 'background.default' : '#fafafa') }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{resp.nome}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2" color="text.secondary">Total a Pagar:</Typography><Typography variant="body2" fontWeight="bold">{formatarMoeda(resp.total)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2" color="text.secondary">Já Pagou:</Typography><Typography variant="body2" color="success.main" fontWeight="bold">{formatarMoeda(resp.pago)}</Typography></Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body1" fontWeight="bold">Restante:</Typography><Typography variant="body1" fontWeight="bold" color={resp.restante <= 0 ? 'success.main' : 'error.main'}>{formatarMoeda(resp.restante)}</Typography></Box>
              </Paper>
            </Grid>
          )) : ( <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Nenhum lançamento registado.</Typography> )}
        </Grid>
      </Paper>

      {/* Modais Fatura e Compras */}
      {/* ... (Os formulários Dialog continuam exatamente iguais) ... */}
      <Dialog open={openFaturaModal} onClose={() => setOpenFaturaModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditingFatura ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nome do Cartão" value={faturaData.nome} onChange={(e) => setFaturaData({...faturaData, nome: e.target.value})} fullWidth variant="outlined" />
          <TextField margin="dense" label="Limite Total do Cartão" type="number" value={faturaData.limite} onChange={(e) => setFaturaData({...faturaData, limite: e.target.value})} fullWidth variant="outlined" />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField margin="dense" label="Dia de Fecho" type="number" value={faturaData.dataFechamento} onChange={(e) => setFaturaData({...faturaData, dataFechamento: e.target.value})} fullWidth variant="outlined" /></Grid>
            <Grid item xs={6}><TextField margin="dense" label="Dia de Vencimento" type="number" value={faturaData.dataVencimento} onChange={(e) => setFaturaData({...faturaData, dataVencimento: e.target.value})} fullWidth variant="outlined" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenFaturaModal(false)}>Cancelar</Button><Button onClick={handleSaveFatura} variant="contained" color="success">Guardar</Button></DialogActions>
      </Dialog>
      
      <Dialog open={openItemModal} onClose={() => setOpenItemModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditingItem ? 'Editar Compra' : 'Nova Compra'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Data (YYYY-MM-DD)" type="date" value={itemData.data} onChange={(e) => setItemData({...itemData, data: e.target.value})} fullWidth variant="outlined" InputLabelProps={{ shrink: true }} sx={{ mb: 2, mt: 1 }} />
          <TextField margin="dense" label="Nome da Compra" value={itemData.nome} onChange={(e) => setItemData({...itemData, nome: e.target.value})} fullWidth variant="outlined" sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <FormControl fullWidth><InputLabel>Responsável</InputLabel><Select value={itemData.responsavelId} label="Responsável" onChange={(e) => setItemData({...itemData, responsavelId: e.target.value})}>{responsaveis.map(resp => (<MenuItem key={resp.id} value={resp.id}>{resp.nome}</MenuItem>))}</Select></FormControl>
            <Button variant="outlined" color="primary" onClick={criarNovoResponsavel} sx={{ height: 56 }}><PersonAddIcon /></Button>
          </Box>
          <TextField margin="dense" label="Tipo (ex: Alimentação)" value={itemData.tipo} onChange={(e) => setItemData({...itemData, tipo: e.target.value})} fullWidth variant="outlined" />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField margin="dense" label="Parcelas" type="number" value={itemData.vezes} onChange={(e) => setItemData({...itemData, vezes: e.target.value})} fullWidth variant="outlined" /></Grid>
            <Grid item xs={6}><TextField margin="dense" label="Valor Total" type="number" value={itemData.valorTotal} onChange={(e) => setItemData({...itemData, valorTotal: e.target.value})} fullWidth variant="outlined" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenItemModal(false)}>Cancelar</Button><Button onClick={handleSaveItem} variant="contained" color="primary">Guardar</Button></DialogActions>
      </Dialog>
      
      <Dialog open={openPagamentoModal} onClose={() => setOpenPagamentoModal(false)} fullWidth maxWidth="xs">
        <DialogTitle>Informar Pagamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Registe o valor total transferido para as despesas.</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Quem pagou?</InputLabel>
            <Select value={pagamentoData.responsavelId} label="Quem pagou?" onChange={(e) => setPagamentoData({...pagamentoData, responsavelId: e.target.value})}>
              {responsaveis.map(resp => (<MenuItem key={resp.id} value={resp.id}>{resp.nome}</MenuItem>))}
            </Select>
          </FormControl>
          <TextField margin="dense" label="Valor Pago" type="number" value={pagamentoData.valor} onChange={(e) => setPagamentoData({...pagamentoData, valor: e.target.value})} fullWidth variant="outlined" />
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenPagamentoModal(false)}>Cancelar</Button><Button onClick={handleSavePagamento} variant="contained" color="success">Registar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}