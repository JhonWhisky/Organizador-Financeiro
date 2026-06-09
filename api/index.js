require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { middlewareSerializacao } = require('./lib/serializar');
const { validar, schemas } = require('./lib/validacao');
const { enviarCodigoRecuperacao } = require('./lib/email');

// ==========================================
// CONFIGURAÇÃO E FAIL-FAST
// ==========================================
const SEGREDO_JWT = process.env.JWT_SECRET;
if (!SEGREDO_JWT) {
  throw new Error('FATAL: variável de ambiente JWT_SECRET não definida. Defina-a antes de iniciar a API.');
}

const app = express();
const prisma = new PrismaClient();

app.set('trust proxy', 1); // necessário para o rate-limit funcionar atrás do proxy da Vercel

// CORS restrito: usa as origens listadas em CORS_ORIGIN (separadas por vírgula).
// Sem essa variável, em produção só permite same-origin; em dev reflete a origem.
const origensPermitidas = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: origensPermitidas.length
      ? origensPermitidas
      : process.env.NODE_ENV === 'production'
        ? false
        : true,
  })
);

app.use(express.json());
app.use(middlewareSerializacao);

// Normaliza o prefixo /api (apenas no início da URL).
app.use((req, res, next) => {
  req.url = req.url.replace(/^\/api/, '') || '/';
  next();
});

// Envolve handlers async para encaminhar erros ao middleware central.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Limita tentativas em rotas sensíveis de autenticação.
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas tentativas. Tenta novamente daqui a alguns minutos.' },
});

app.get('/ping', (req, res) => res.json({ message: 'API online e segura!' }));

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post(
  '/auth/registrar',
  limiteAuth,
  validar(schemas.registrar),
  asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExiste) return res.status(400).json({ error: 'Email já registado.' });

    const senhaEncriptada = await bcrypt.hash(senha, 10);
    const novoUsuario = await prisma.usuario.create({ data: { email, senha: senhaEncriptada } });

    res.status(201).json({ message: 'Conta criada!', usuario: { id: novoUsuario.id, email: novoUsuario.email } });
  })
);

app.post(
  '/auth/login',
  limiteAuth,
  validar(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(400).json({ error: 'Email ou senha incorretos.' });

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) return res.status(400).json({ error: 'Email ou senha incorretos.' });

    const token = jwt.sign({ id: usuario.id }, SEGREDO_JWT, { expiresIn: '7d' });
    res.json({ token, email: usuario.email });
  })
);

// ==========================================
// ROTAS DE RECUPERAÇÃO DE SENHA
// ==========================================
app.post(
  '/auth/esqueci-senha',
  limiteAuth,
  validar(schemas.esqueciSenha),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Só gera/envia código se o utilizador existir, mas a resposta é SEMPRE
    // genérica e 200 para não permitir enumeração de emails.
    if (usuario) {
      const codigo = crypto.randomInt(100000, 1000000).toString();
      const codigoHash = await bcrypt.hash(codigo, 10);
      const expiracao = new Date(Date.now() + 15 * 60000);

      await prisma.usuario.update({
        where: { email },
        data: { codigoRecuperacao: codigoHash, expiracaoCodigo: expiracao },
      });

      await enviarCodigoRecuperacao(email, codigo);
    }

    res.json({ message: 'Se este e-mail existir, um código de recuperação foi enviado.' });
  })
);

app.post(
  '/auth/redefinir-senha',
  limiteAuth,
  validar(schemas.redefinirSenha),
  asyncHandler(async (req, res) => {
    const { email, codigo, novaSenha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.codigoRecuperacao || !usuario.expiracaoCodigo) {
      return res.status(400).json({ error: 'Código inválido ou incorreto.' });
    }
    if (new Date() > usuario.expiracaoCodigo) {
      return res.status(400).json({ error: 'Este código já expirou. Pede um novo.' });
    }
    const codigoCorreto = await bcrypt.compare(codigo, usuario.codigoRecuperacao);
    if (!codigoCorreto) {
      return res.status(400).json({ error: 'Código inválido ou incorreto.' });
    }

    const senhaEncriptada = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({
      where: { email },
      data: { senha: senhaEncriptada, codigoRecuperacao: null, expiracaoCodigo: null },
    });

    res.json({ message: 'Senha redefinida com sucesso! Já podes fazer login.' });
  })
);

// ==========================================
// MIDDLEWARE DE PROTEÇÃO
// ==========================================
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Acesso negado.' });
  const token = authHeader.split(' ')[1];
  try {
    const decodificado = jwt.verify(token, SEGREDO_JWT);
    req.usuarioId = decodificado.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

app.use(verificarToken);

// ==========================================
// ROTAS PRIVADAS (Filtradas por usuarioId)
// ==========================================

// --- RESPONSÁVEIS ---
app.post(
  '/responsaveis',
  validar(schemas.responsavel),
  asyncHandler(async (req, res) => {
    const novo = await prisma.responsavel.create({ data: { nome: req.body.nome, usuarioId: req.usuarioId } });
    res.status(201).json(novo);
  })
);
app.get(
  '/responsaveis',
  asyncHandler(async (req, res) => {
    res.json(await prisma.responsavel.findMany({ where: { usuarioId: req.usuarioId } }));
  })
);

// --- SALÁRIOS ---
app.post(
  '/salarios',
  validar(schemas.salario),
  asyncHandler(async (req, res) => {
    const novo = await prisma.salario.create({
      data: { nome: req.body.nome, valor: req.body.valor, responsavelId: req.body.responsavelId, usuarioId: req.usuarioId },
    });
    res.status(201).json(novo);
  })
);
app.get(
  '/salarios',
  asyncHandler(async (req, res) => {
    res.json(await prisma.salario.findMany({ where: { usuarioId: req.usuarioId }, include: { responsavel: true } }));
  })
);
app.put(
  '/salarios/:id',
  validar(schemas.salario),
  asyncHandler(async (req, res) => {
    await prisma.salario.updateMany({
      where: { id: parseInt(req.params.id), usuarioId: req.usuarioId },
      data: { nome: req.body.nome, valor: req.body.valor, responsavelId: req.body.responsavelId },
    });
    res.json({ success: true });
  })
);
app.delete(
  '/salarios/:id',
  asyncHandler(async (req, res) => {
    await prisma.salario.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } });
    res.json({ success: true });
  })
);

// --- FATURAS E COMPRAS ---
app.post(
  '/faturas',
  validar(schemas.fatura),
  asyncHandler(async (req, res) => {
    const nova = await prisma.fatura.create({
      data: {
        nome: req.body.nome,
        limite: req.body.limite,
        dataFechamento: req.body.dataFechamento,
        dataVencimento: req.body.dataVencimento,
        usuarioId: req.usuarioId,
      },
    });
    res.status(201).json(nova);
  })
);
app.get(
  '/faturas',
  asyncHandler(async (req, res) => {
    const faturas = await prisma.fatura.findMany({
      where: { usuarioId: req.usuarioId },
      include: { itens: { include: { responsavel: true } } },
    });
    res.json(faturas);
  })
);
app.put(
  '/faturas/:id',
  validar(schemas.fatura),
  asyncHandler(async (req, res) => {
    await prisma.fatura.updateMany({
      where: { id: parseInt(req.params.id), usuarioId: req.usuarioId },
      data: {
        nome: req.body.nome,
        limite: req.body.limite,
        dataFechamento: req.body.dataFechamento,
        dataVencimento: req.body.dataVencimento,
      },
    });
    res.json({ success: true });
  })
);
app.delete(
  '/faturas/:id',
  asyncHandler(async (req, res) => {
    await prisma.fatura.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } });
    res.json({ success: true });
  })
);

app.post(
  '/itens',
  validar(schemas.item),
  asyncHandler(async (req, res) => {
    const novo = await prisma.itemFatura.create({
      data: {
        data: req.body.data,
        nome: req.body.nome,
        tipo: req.body.tipo,
        vezes: req.body.vezes,
        valorTotal: req.body.valorTotal,
        faturaId: req.body.faturaId,
        responsavelId: req.body.responsavelId,
        usuarioId: req.usuarioId,
      },
    });
    res.status(201).json(novo);
  })
);
app.put(
  '/itens/:id',
  validar(schemas.itemUpdate),
  asyncHandler(async (req, res) => {
    await prisma.itemFatura.updateMany({
      where: { id: parseInt(req.params.id), usuarioId: req.usuarioId },
      data: {
        data: req.body.data,
        nome: req.body.nome,
        tipo: req.body.tipo,
        vezes: req.body.vezes,
        valorTotal: req.body.valorTotal,
        responsavelId: req.body.responsavelId,
      },
    });
    res.json({ success: true });
  })
);
app.delete(
  '/itens/:id',
  asyncHandler(async (req, res) => {
    await prisma.itemFatura.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } });
    res.json({ success: true });
  })
);

// --- ASSINATURAS ---
app.post(
  '/assinaturas',
  validar(schemas.assinatura),
  asyncHandler(async (req, res) => {
    const nova = await prisma.assinatura.create({
      data: {
        nome: req.body.nome,
        valor: req.body.valor,
        diaCobranca: req.body.diaCobranca,
        faturaId: req.body.faturaId,
        responsavelId: req.body.responsavelId,
        usuarioId: req.usuarioId,
      },
    });
    res.status(201).json(nova);
  })
);
app.get(
  '/assinaturas',
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.assinatura.findMany({
        where: { usuarioId: req.usuarioId },
        include: { responsavel: true, fatura: true },
      })
    );
  })
);
app.put(
  '/assinaturas/:id',
  validar(schemas.assinatura),
  asyncHandler(async (req, res) => {
    await prisma.assinatura.updateMany({
      where: { id: parseInt(req.params.id), usuarioId: req.usuarioId },
      data: {
        nome: req.body.nome,
        valor: req.body.valor,
        diaCobranca: req.body.diaCobranca,
        faturaId: req.body.faturaId,
        responsavelId: req.body.responsavelId,
      },
    });
    res.json({ success: true });
  })
);
app.delete(
  '/assinaturas/:id',
  asyncHandler(async (req, res) => {
    await prisma.assinatura.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } });
    res.json({ success: true });
  })
);

// --- PAGAMENTOS ---
app.post(
  '/pagamentos',
  validar(schemas.pagamento),
  asyncHandler(async (req, res) => {
    const novo = await prisma.pagamento.create({
      data: {
        mes: req.body.mes,
        ano: req.body.ano,
        valor: req.body.valor,
        responsavelId: req.body.responsavelId,
        usuarioId: req.usuarioId,
      },
    });
    res.status(201).json(novo);
  })
);
app.get(
  '/pagamentos',
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.pagamento.findMany({ where: { usuarioId: req.usuarioId }, include: { responsavel: true } })
    );
  })
);

// --- PIX ---
app.post(
  '/pix',
  validar(schemas.pix),
  asyncHandler(async (req, res) => {
    const novo = await prisma.pix.create({
      data: {
        data: req.body.data,
        destinatario: req.body.destinatario,
        valor: req.body.valor,
        descricao: req.body.descricao,
        responsavelId: req.body.responsavelId,
        usuarioId: req.usuarioId,
      },
    });
    res.status(201).json(novo);
  })
);
app.get(
  '/pix',
  asyncHandler(async (req, res) => {
    res.json(await prisma.pix.findMany({ where: { usuarioId: req.usuarioId }, include: { responsavel: true } }));
  })
);
app.put(
  '/pix/:id',
  validar(schemas.pixUpdate),
  asyncHandler(async (req, res) => {
    await prisma.pix.updateMany({
      where: { id: parseInt(req.params.id), usuarioId: req.usuarioId },
      data: {
        data: req.body.data,
        destinatario: req.body.destinatario,
        valor: req.body.valor,
        descricao: req.body.descricao,
        responsavelId: req.body.responsavelId,
      },
    });
    res.json({ success: true });
  })
);
app.delete(
  '/pix/:id',
  asyncHandler(async (req, res) => {
    await prisma.pix.deleteMany({ where: { id: parseInt(req.params.id), usuarioId: req.usuarioId } });
    res.json({ success: true });
  })
);

// ==========================================
// MIDDLEWARE CENTRAL DE ERROS
// ==========================================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[erro] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: 'Ocorreu um erro interno. Tenta novamente.' });
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Servidor a rodar na porta ${PORT}`));
}

module.exports = app;
