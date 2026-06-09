const { Prisma } = require('@prisma/client');

// Converte recursivamente os tipos do Prisma para formatos amigáveis ao frontend:
// - Decimal  -> Number   (evita strings em cálculos monetários no React)
// - Date     -> 'YYYY-MM-DD' (mantém o formato que o frontend já consome)
function serializar(valor) {
  if (valor === null || valor === undefined) return valor;
  if (Prisma.Decimal.isDecimal(valor)) return valor.toNumber();
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (Array.isArray(valor)) return valor.map(serializar);
  if (typeof valor === 'object') {
    const saida = {};
    for (const chave of Object.keys(valor)) saida[chave] = serializar(valor[chave]);
    return saida;
  }
  return valor;
}

// Middleware: intercepta res.json e serializa o corpo automaticamente.
function middlewareSerializacao(req, res, next) {
  const jsonOriginal = res.json.bind(res);
  res.json = (corpo) => jsonOriginal(serializar(corpo));
  next();
}

module.exports = { serializar, middlewareSerializacao };
