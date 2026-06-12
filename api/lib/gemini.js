const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

function criarCliente() {
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.');
  return new GoogleGenerativeAI(apiKey);
}

function construirContextoFinanceiro(dados) {
  const { salarios, assinaturas, faturas, pix, pagamentos } = dados;
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const mesesStr = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const moeda = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const totalSalarios = salarios.reduce((s, sal) => s + Number(sal.valor), 0);
  const totalAssinaturas = assinaturas.reduce((s, ass) => s + Number(ass.valor), 0);

  let secaoSalarios = `## Receitas (Salários)\nTotal mensal: ${moeda(totalSalarios)}\n`;
  salarios.forEach(s => { secaoSalarios += `- ${s.responsavel?.nome || s.responsavel}: ${moeda(s.valor)}\n`; });

  let secaoAssinaturas = `## Assinaturas Mensais\nTotal: ${moeda(totalAssinaturas)}\n`;
  assinaturas.forEach(a => { secaoAssinaturas += `- ${a.nome}: ${moeda(a.valor)} (cartão: ${a.fatura?.nome || a.fatura}, dia ${a.diaCobranca})\n`; });

  let secaoFaturas = `## Cartões de Crédito\n`;
  faturas.forEach(fat => {
    let totalMes = 0;
    let totalDevido = 0;
    fat.itens.forEach(item => {
      const dataStr = item.data instanceof Date ? item.data.toISOString() : String(item.data);
      const [anoC, mesC, diaC] = dataStr.split('T')[0].split('-').map(Number);
      let mesFat = mesC - 1; let anoFat = anoC;
      if (diaC >= fat.dataFechamento) { mesFat++; if (mesFat > 11) { mesFat = 0; anoFat++; } }
      const parcela = Number(item.valorTotal) / item.vezes;
      for (let i = 0; i < item.vezes; i++) {
        let mp = mesFat + i; let ap = anoFat + Math.floor(mp / 12); mp = mp % 12;
        if (ap > anoAtual || (ap === anoAtual && mp >= mesAtual)) totalDevido += parcela;
        if (ap === anoAtual && mp === mesAtual) totalMes += parcela;
      }
    });
    assinaturas.filter(a => a.fatura?.nome === fat.nome || a.fatura === fat.nome).forEach(a => {
      totalMes += Number(a.valor);
      totalDevido += Number(a.valor);
    });
    const disponivel = Number(fat.limite) - totalDevido;
    secaoFaturas += `\n### ${fat.nome} (limite: ${moeda(fat.limite)}, fecha dia ${fat.dataFechamento}, vence dia ${fat.dataVencimento})\n`;
    secaoFaturas += `- Fatura de ${mesesStr[mesAtual]}/${anoAtual}: ${moeda(totalMes)}\n`;
    secaoFaturas += `- Limite disponível atual: ${moeda(disponivel)}\n`;
    if (fat.itens.length > 0) {
      secaoFaturas += `- Compras parceladas em andamento:\n`;
      fat.itens.forEach(item => {
        secaoFaturas += `  • ${item.nome} (${item.vezes}x de ${moeda(Number(item.valorTotal) / item.vezes)}, resp: ${item.responsavel?.nome || item.responsavel})\n`;
      });
    }
  });

  const pixRecentes = [...pix]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 20);
  let secaoPix = `## PIX Recentes (últimos ${pixRecentes.length})\n`;
  pixRecentes.forEach(p => {
    const data = (p.data instanceof Date ? p.data.toISOString() : String(p.data)).split('T')[0];
    secaoPix += `- ${data} | ${p.destinatario} | ${moeda(p.valor)} | ${p.descricao || '-'} (${p.responsavel?.nome || p.responsavel})\n`;
  });

  let secaoPagamentos = `## Pagamentos de Fatura Registados (${mesesStr[mesAtual]}/${anoAtual})\n`;
  const pagsDoMes = pagamentos.filter(p => p.mes === mesAtual && p.ano === anoAtual);
  if (pagsDoMes.length === 0) {
    secaoPagamentos += `Nenhum pagamento registado este mês.\n`;
  } else {
    pagsDoMes.forEach(p => { secaoPagamentos += `- ${p.responsavel?.nome || p.responsavel}: ${moeda(p.valor)}\n`; });
  }

  const saldoLivre = totalSalarios - totalAssinaturas;
  let secaoResumo = `## Resumo Executivo\n`;
  secaoResumo += `- Receita total: ${moeda(totalSalarios)}\n`;
  secaoResumo += `- Assinaturas fixas: ${moeda(totalAssinaturas)}\n`;
  secaoResumo += `- Saldo após assinaturas: ${moeda(saldoLivre)}\n`;
  secaoResumo += `- Mês atual: ${mesesStr[mesAtual]} de ${anoAtual}\n`;

  return [secaoResumo, secaoSalarios, secaoAssinaturas, secaoFaturas, secaoPix, secaoPagamentos].join('\n');
}

const MODELOS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

async function tentarComModelo(cliente, modelo, systemInstruction, historico, novaMensagem) {
  const model = cliente.getGenerativeModel({
    model: modelo,
    systemInstruction: { parts: [{ text: systemInstruction }] },
  });
  const chat = model.startChat({
    history: historico.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });
  const result = await chat.sendMessage(novaMensagem);
  return result.response.text();
}

async function enviarMensagem(historico, novaMensagem, dadosFinanceiros) {
  const cliente = criarCliente();
  const contexto = construirContextoFinanceiro(dadosFinanceiros);

  const systemInstruction = `És um assistente financeiro pessoal inteligente e simpático integrado no Organizador Financeiro do utilizador. Respondes sempre em português de Portugal (PT-PT). Tens acesso aos dados financeiros reais do utilizador abaixo. Usa esses dados para dar respostas precisas, concretos e úteis sobre gastos, projeções de saldo, faturas futuras, dicas de economia, e qualquer dúvida financeira. Sê direto, claro e usa números reais quando relevante. Formata valores sempre em reais (R$).

DADOS FINANCEIROS DO UTILIZADOR (hoje: ${new Date().toLocaleDateString('pt-BR')}):
${contexto}`;

  for (const modelo of MODELOS) {
    try {
      return await tentarComModelo(cliente, modelo, systemInstruction, historico, novaMensagem);
    } catch (e) {
      const recuperavel = e.status === 503 || e.status === 429 || e.status === 500;
      const temProximo = MODELOS.indexOf(modelo) < MODELOS.length - 1;
      if (recuperavel && temProximo) {
        console.warn(`[gemini] ${modelo} indisponível (${e.status}), a tentar ${MODELOS[MODELOS.indexOf(modelo) + 1]}...`);
        continue;
      }
      throw e;
    }
  }
}

module.exports = { enviarMensagem };
