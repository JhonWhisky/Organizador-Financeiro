const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) { req.url = req.url.replace('/api', ''); }
  next();
});

const SEGREDO_JWT = process.env.JWT_SECRET || 'meu_segredo_super_seguro_123';

app.get('/ping', (req, res) => { res.json({ message: 'API online e segura!' }); });

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post('/auth/registrar', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExiste) return res.status(400).json({ error: 'Email já registado.' });

    const salt = await bcrypt.genSalt(10);
    const senhaEncriptada = await bcrypt.hash(senha, salt);
    const novoUsuario = await prisma.usuario.create({ data: { email, senha: senhaEncriptada } });

    res.status(201).json({ message: 'Conta criada!', usuario: { id: novoUsuario.id, email: novoUsuario.email } });
  } catch (error) { res.status(500).json({ error: 'Erro ao criar conta.' }); }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(400).json({ error: 'Email ou senha incorretos.' });

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) return res.status(400).json({ error: 'Email ou senha incorretos.' });

    const token = jwt.sign({ id: usuario.id }, SEGREDO_JWT, { expiresIn: '7d' });
    res.json({ token, email: usuario.email });
  } catch (error) { res.status(500).json({ error: 'Erro ao fazer login.' }); }
});

// ==========================================
// MIDDLEWARE DE PROTEÇÃO (O Fiel Depositário)
// ==========================================
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Acesso negado.' });
  const token = authHeader.split(' ')[1];
  try {
    const decodificado = jwt.verify(token, SEGREDO_JWT);
    req.usuarioId = decodificado.id; // <-- Injeta o ID do utilizador logado em todas as rotas!
    next();
  } catch (error) { res.status(401).json({ error: 'Token inválido.' }); }
};

app.use(verificarToken);

// ==========================================
// ROTAS PRIVADAS (Filtradas por usuarioId)
// ==========================================

// --- RESPONSÁVEIS ---
app.post('/responsaveis', async (req, res) => {
  try { const novo = await prisma.responsavel.create({ data: { nome: req.body.nome, usuarioId: req.usuarioId } }); res.status(201).json(novo); } 
  catch (error) { res.status(400).json({ error: 'Erro ao criar.' }); }
});
app.get('/responsaveis', async (req, res) => {
  try { const lista = await prisma.responsavel.findMany({ where: { usuarioId: req.usuarioId } }); res.json(lista); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});

// --- SALÁRIOS ---
app.post('/salarios', async (req, res) => {
  try { const novo = await prisma.salario.create({ data: { ...req.body, valor: parseFloat(req.body.valor), responsavelId: parseInt(req.body.responsavelId), usuarioId: req.usuarioId } }); res.status(201).json(novo); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.get('/salarios', async (req, res) => {
  try { const lista = await prisma.salario.findMany({ where: { usuarioId: req.usuarioId }, include: { responsavel: true } }); res.json(lista); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});
app.put('/salarios/:id', async (req, res) => {
  try { await prisma.salario.updateMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId }, data: { nome: req.body.nome, valor: parseFloat(req.body.valor), responsavelId: parseInt(req.body.responsavelId) } }); res.json({ success: true }); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.delete('/salarios/:id', async (req, res) => {
  try { await prisma.salario.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } }); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});

// --- FATURAS E COMPRAS ---
app.post('/faturas', async (req, res) => {
  try { const nova = await prisma.fatura.create({ data: { ...req.body, limite: parseFloat(req.body.limite), dataFechamento: parseInt(req.body.dataFechamento), dataVencimento: parseInt(req.body.dataVencimento), usuarioId: req.usuarioId } }); res.status(201).json(nova); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.get('/faturas', async (req, res) => {
  try { const faturas = await prisma.fatura.findMany({ where: { usuarioId: req.usuarioId }, include: { itens: { include: { responsavel: true } } } }); res.json(faturas); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});
app.put('/faturas/:id', async (req, res) => {
  try { await prisma.fatura.updateMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId }, data: { nome: req.body.nome, limite: parseFloat(req.body.limite), dataFechamento: parseInt(req.body.dataFechamento), dataVencimento: parseInt(req.body.dataVencimento) } }); res.json({ success: true }); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.delete('/faturas/:id', async (req, res) => {
  try { await prisma.fatura.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } }); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});

app.post('/itens', async (req, res) => {
  try { const novo = await prisma.itemFatura.create({ data: { ...req.body, vezes: parseInt(req.body.vezes), valorTotal: parseFloat(req.body.valorTotal), faturaId: parseInt(req.body.faturaId), responsavelId: parseInt(req.body.responsavelId), usuarioId: req.usuarioId } }); res.status(201).json(novo); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.put('/itens/:id', async (req, res) => {
  try { await prisma.itemFatura.updateMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId }, data: { data: req.body.data, nome: req.body.nome, tipo: req.body.tipo, vezes: parseInt(req.body.vezes), valorTotal: parseFloat(req.body.valorTotal), responsavelId: parseInt(req.body.responsavelId) } }); res.json({ success: true }); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.delete('/itens/:id', async (req, res) => {
  try { await prisma.itemFatura.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } }); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});

// --- ASSINATURAS ---
app.post('/assinaturas', async (req, res) => {
  try { const nova = await prisma.assinatura.create({ data: { nome: req.body.nome, valor: parseFloat(req.body.valor), diaCobranca: parseInt(req.body.diaCobranca), faturaId: parseInt(req.body.faturaId), responsavelId: parseInt(req.body.responsavelId), usuarioId: req.usuarioId } }); res.status(201).json(nova); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.get('/assinaturas', async (req, res) => {
  try { const assinaturas = await prisma.assinatura.findMany({ where: { usuarioId: req.usuarioId }, include: { responsavel: true, fatura: true } }); res.json(assinaturas); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});
app.put('/assinaturas/:id', async (req, res) => {
  try { await prisma.assinatura.updateMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId }, data: { nome: req.body.nome, valor: parseFloat(req.body.valor), diaCobranca: parseInt(req.body.diaCobranca), faturaId: parseInt(req.body.faturaId), responsavelId: parseInt(req.body.responsavelId) } }); res.json({ success: true }); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.delete('/assinaturas/:id', async (req, res) => {
  try { await prisma.assinatura.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } }); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});

// --- PAGAMENTOS ---
app.post('/pagamentos', async (req, res) => {
  try { const novo = await prisma.pagamento.create({ data: { mes: parseInt(req.body.mes), ano: parseInt(req.body.ano), valor: parseFloat(req.body.valor), responsavelId: parseInt(req.body.responsavelId), usuarioId: req.usuarioId } }); res.status(201).json(novo); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.get('/pagamentos', async (req, res) => {
  try { const pagamentos = await prisma.pagamento.findMany({ where: { usuarioId: req.usuarioId }, include: { responsavel: true } }); res.json(pagamentos); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});

// --- PIX ---
app.post('/pix', async (req, res) => {
  try { const novo = await prisma.pix.create({ data: { ...req.body, valor: parseFloat(req.body.valor), responsavelId: parseInt(req.body.responsavelId), usuarioId: req.usuarioId } }); res.status(201).json(novo); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.get('/pix', async (req, res) => {
  try { const lista = await prisma.pix.findMany({ where: { usuarioId: req.usuarioId }, include: { responsavel: true } }); res.json(lista); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});
app.put('/pix/:id', async (req, res) => {
  try { await prisma.pix.updateMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId }, data: { data: req.body.data, destinatario: req.body.destinatario, valor: parseFloat(req.body.valor), descricao: req.body.descricao, responsavelId: parseInt(req.body.responsavelId) } }); res.json({ success: true }); } 
  catch (error) { res.status(400).json({ error: 'Erro.' }); }
});
app.delete('/pix/:id', async (req, res) => {
  try { await prisma.pix.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } }); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: 'Erro.' }); }
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => { console.log(`🚀 Servidor a rodar na porta ${PORT}`); });
}

module.exports = app;