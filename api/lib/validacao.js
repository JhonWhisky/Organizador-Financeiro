const { z } = require('zod');

// Middleware genérico de validação. Em caso de sucesso, substitui req.body
// pelos dados já validados/coeridos (e SEM campos extra — corrige mass assignment,
// pois o zod descarta chaves não declaradas no schema por defeito).
const validar = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({
      error: 'Dados inválidos.',
      detalhes: resultado.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensagem: i.message,
      })),
    });
  }
  req.body = resultado.data;
  next();
};

// --- Tipos reutilizáveis ---
const email = z.string().trim().toLowerCase().email('Email inválido.');
const senha = z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.');
const dinheiro = z.coerce.number().finite().nonnegative('O valor não pode ser negativo.');
const dia = z.coerce.number().int().min(1).max(31);
const id = z.coerce.number().int().positive();
const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato AAAA-MM-DD.')
  .transform((s) => new Date(s + 'T00:00:00.000Z'));

// --- Schemas por rota ---
const schemas = {
  registrar: z.object({ email, senha }),
  login: z.object({ email, senha: z.string().min(1, 'Senha obrigatória.') }),
  esqueciSenha: z.object({ email }),
  redefinirSenha: z.object({
    email,
    codigo: z.string().regex(/^\d{6}$/, 'Código inválido.'),
    novaSenha: senha,
  }),

  responsavel: z.object({ nome: z.string().trim().min(1, 'Nome obrigatório.') }),

  salario: z.object({
    nome: z.string().trim().min(1),
    valor: dinheiro,
    responsavelId: id,
  }),

  fatura: z.object({
    nome: z.string().trim().min(1),
    limite: dinheiro,
    dataFechamento: dia,
    dataVencimento: dia,
  }),

  item: z.object({
    data: dataISO,
    nome: z.string().trim().min(1),
    tipo: z.string().trim().min(1),
    vezes: z.coerce.number().int().min(1, 'Mínimo de 1 parcela.'),
    valorTotal: dinheiro,
    faturaId: id,
    responsavelId: id,
  }),

  // No update de item a fatura não muda
  itemUpdate: z.object({
    data: dataISO,
    nome: z.string().trim().min(1),
    tipo: z.string().trim().min(1),
    vezes: z.coerce.number().int().min(1),
    valorTotal: dinheiro,
    responsavelId: id,
  }),

  assinatura: z.object({
    nome: z.string().trim().min(1),
    valor: dinheiro,
    diaCobranca: dia,
    faturaId: id,
    responsavelId: id,
  }),

  pagamento: z.object({
    mes: z.coerce.number().int().min(0).max(11),
    ano: z.coerce.number().int().min(2000).max(2100),
    valor: dinheiro,
    responsavelId: id,
  }),

  pix: z.object({
    data: dataISO,
    destinatario: z.string().trim().min(1),
    valor: dinheiro,
    descricao: z.string().trim().optional().default(''),
    responsavelId: id,
  }),
  pixUpdate: z.object({
    data: dataISO,
    destinatario: z.string().trim().min(1),
    valor: dinheiro,
    descricao: z.string().trim().optional().default(''),
    responsavelId: id,
  }),
};

module.exports = { validar, schemas };
