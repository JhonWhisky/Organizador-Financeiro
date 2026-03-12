const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Permite que o React (que roda na porta 3000) converse com a API (porta 3001)
app.use(cors());
// Permite que a API entenda dados enviados no formato JSON
app.use(express.json());

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// Rota de Teste
app.get('/ping', (req, res) => {
  res.json({ message: 'API do Organizador Financeiro está online e conectada ao banco!' });
});

// ==========================================
// ROTAS DE RESPONSÁVEIS
// ==========================================

// Criar um novo responsável (Ex: João, Maria)
app.post('/responsaveis', async (req, res) => {
  try {
    const { nome } = req.body;
    const novoResponsavel = await prisma.responsavel.create({
      data: { nome }
    });
    res.status(201).json(novoResponsavel);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar. O nome já deve existir ou é inválido.' });
  }
});

// Listar todos os responsáveis
app.get('/responsaveis', async (req, res) => {
  try {
    const responsaveis = await prisma.responsavel.findMany();
    res.json(responsaveis);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar responsáveis.' });
  }
});

// ==========================================
// ROTAS DE SALÁRIOS
// ==========================================

// Criar um novo salário
app.post('/salarios', async (req, res) => {
  try {
    const { nome, valor, responsavelId } = req.body;
    const novoSalario = await prisma.salario.create({
      data: {
        nome,
        valor: parseFloat(valor),
        responsavelId: parseInt(responsavelId)
      }
    });
    res.status(201).json(novoSalario);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao cadastrar salário. Verifique os dados enviados.' });
  }
});

// Listar todos os salários (trazendo junto os dados do responsável)
app.get('/salarios', async (req, res) => {
  try {
    const salarios = await prisma.salario.findMany({
      include: {
        responsavel: true // Faz um "JOIN" automático para trazer o nome da pessoa
      }
    });
    res.json(salarios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar salários.' });
  }
});

// Iniciar o servidor localmente (Podes comentar ou deixar assim)
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor a rodar na porta ${PORT}`);
  });
}

// Atualizar um salário existente
app.put('/salarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor, responsavelId } = req.body;
    const salarioAtualizado = await prisma.salario.update({
      where: { id: parseInt(id) },
      data: { nome, valor: parseFloat(valor), responsavelId: parseInt(responsavelId) }
    });
    res.json(salarioAtualizado);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar salário.' });
  }
});

// Eliminar um salário
app.delete('/salarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.salario.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Salário eliminado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar salário.' });
  }
});

// ==========================================
// ROTAS DE FATURAS (CARTÕES)
// ==========================================

// Criar um novo Cartão
app.post('/faturas', async (req, res) => {
  try {
    const { nome, limite, dataFechamento, dataVencimento } = req.body;
    const novaFatura = await prisma.fatura.create({
      data: {
        nome,
        limite: parseFloat(limite),
        dataFechamento: parseInt(dataFechamento),
        dataVencimento: parseInt(dataVencimento)
      }
    });
    res.status(201).json(novaFatura);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar o cartão. O nome já pode existir.' });
  }
});

// Listar todos os Cartões (trazendo também os itens/compras vinculados)
app.get('/faturas', async (req, res) => {
  try {
    const faturas = await prisma.fatura.findMany({
      include: {
        itens: {
          include: {
            responsavel: true // Traz o nome de quem fez a compra
          }
        }
      }
    });
    res.json(faturas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cartões.' });
  }
});

// Atualizar Cartão
app.put('/faturas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, limite, dataFechamento, dataVencimento } = req.body;
    const faturaAtualizada = await prisma.fatura.update({
      where: { id: parseInt(id) },
      data: { nome, limite: parseFloat(limite), dataFechamento: parseInt(dataFechamento), dataVencimento: parseInt(dataVencimento) }
    });
    res.json(faturaAtualizada);
  } catch (error) { res.status(400).json({ error: 'Erro ao atualizar.' }); }
});

// Eliminar um Cartão
app.delete('/faturas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fatura.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Cartão eliminado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar cartão.' });
  }
});

// ==========================================
// ROTAS DE ITENS (COMPRAS)
// ==========================================

// Criar uma nova Compra
app.post('/itens', async (req, res) => {
  try {
    const { data, nome, tipo, vezes, valorTotal, faturaId, responsavelId } = req.body;
    const novoItem = await prisma.itemFatura.create({
      data: {
        data,
        nome,
        tipo,
        vezes: parseInt(vezes),
        valorTotal: parseFloat(valorTotal),
        faturaId: parseInt(faturaId),
        responsavelId: parseInt(responsavelId)
      }
    });
    res.status(201).json(novoItem);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: 'Erro ao registar a compra.' });
  }
});

// Atualizar Compra
app.put('/itens/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, nome, tipo, vezes, valorTotal, responsavelId } = req.body;
    const itemAtualizado = await prisma.itemFatura.update({
      where: { id: parseInt(id) },
      data: { data, nome, tipo, vezes: parseInt(vezes), valorTotal: parseFloat(valorTotal), responsavelId: parseInt(responsavelId) }
    });
    res.json(itemAtualizado);
  } catch (error) { res.status(400).json({ error: 'Erro ao atualizar compra.' }); }
});

// Eliminar uma Compra
app.delete('/itens/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.itemFatura.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Compra eliminada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar compra.' });
  }
});

// ==========================================
// ROTAS DE ASSINATURAS
// ==========================================
app.post('/assinaturas', async (req, res) => {
  try {
    const { nome, valor, diaCobranca, faturaId, responsavelId } = req.body;
    const novaAssinatura = await prisma.assinatura.create({
      data: { nome, valor: parseFloat(valor), diaCobranca: parseInt(diaCobranca), faturaId: parseInt(faturaId), responsavelId: parseInt(responsavelId) }
    });
    res.status(201).json(novaAssinatura);
  } catch (error) { res.status(400).json({ error: 'Erro ao criar assinatura.' }); }
});

app.get('/assinaturas', async (req, res) => {
  try {
    const assinaturas = await prisma.assinatura.findMany({
      include: { responsavel: true, fatura: true }
    });
    res.json(assinaturas);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar assinaturas.' }); }
});

app.put('/assinaturas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor, diaCobranca, faturaId, responsavelId } = req.body;
    const assAtualizada = await prisma.assinatura.update({
      where: { id: parseInt(id) },
      data: { nome, valor: parseFloat(valor), diaCobranca: parseInt(diaCobranca), faturaId: parseInt(faturaId), responsavelId: parseInt(responsavelId) }
    });
    res.json(assAtualizada);
  } catch (error) { res.status(400).json({ error: 'Erro ao atualizar assinatura.' }); }
});

app.delete('/assinaturas/:id', async (req, res) => {
  try {
    await prisma.assinatura.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Assinatura eliminada!' });
  } catch (error) { res.status(500).json({ error: 'Erro ao eliminar assinatura.' }); }
});

// ==========================================
// ROTAS DE PAGAMENTOS (ACERTO GLOBAL)
// ==========================================
app.post('/pagamentos', async (req, res) => {
  try {
    const { mes, ano, valor, responsavelId } = req.body;
    const novoPagamento = await prisma.pagamento.create({
      data: { mes: parseInt(mes), ano: parseInt(ano), valor: parseFloat(valor), responsavelId: parseInt(responsavelId) }
    });
    res.status(201).json(novoPagamento);
  } catch (error) { res.status(400).json({ error: 'Erro ao registar pagamento.' }); }
});

app.get('/pagamentos', async (req, res) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({ include: { responsavel: true } });
    res.json(pagamentos);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar pagamentos.' }); }
});

// ==========================================
// ROTAS DE PIX
// ==========================================
app.post('/pix', async (req, res) => {
  try {
    const { data, destinatario, valor, descricao, responsavelId } = req.body;
    const novoPix = await prisma.pix.create({
      data: { data, destinatario, valor: parseFloat(valor), descricao, responsavelId: parseInt(responsavelId) }
    });
    res.status(201).json(novoPix);
  } catch (error) { res.status(400).json({ error: 'Erro ao registar PIX.' }); }
});

app.get('/pix', async (req, res) => {
  try {
    const listaPix = await prisma.pix.findMany({ include: { responsavel: true } });
    res.json(listaPix);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar PIX.' }); }
});

app.put('/pix/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, destinatario, valor, descricao, responsavelId } = req.body;
    const pixAtualizado = await prisma.pix.update({
      where: { id: parseInt(id) },
      data: { data, destinatario, valor: parseFloat(valor), descricao, responsavelId: parseInt(responsavelId) }
    });
    res.json(pixAtualizado);
  } catch (error) { res.status(400).json({ error: 'Erro ao atualizar PIX.' }); }
});

app.delete('/pix/:id', async (req, res) => {
  try {
    await prisma.pix.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'PIX eliminado!' });
  } catch (error) { res.status(500).json({ error: 'Erro ao eliminar PIX.' }); }
});

// O Vercel precisa que exportemos a app em vez de apenas fazer o app.listen
module.exports = app;