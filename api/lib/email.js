const nodemailer = require('nodemailer');

const configurado = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter = null;
if (configurado) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para porta 465
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Envia o código de recuperação por email. Se o SMTP não estiver configurado
// (ex.: ambiente de desenvolvimento), regista o código no log do servidor em vez
// de o devolver na resposta HTTP — nunca expõe o código ao cliente.
async function enviarCodigoRecuperacao(email, codigo) {
  if (!configurado) {
    console.log(`[email] SMTP não configurado. Código de recuperação para ${email}: ${codigo}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Recuperação de senha — Organizador Financeiro',
    text: `O teu código de recuperação é: ${codigo}\n\nEle expira em 15 minutos. Se não pediste a recuperação, ignora este email.`,
    html: `<p>O teu código de recuperação é:</p><h2 style="letter-spacing:4px">${codigo}</h2><p>Ele expira em 15 minutos. Se não pediste a recuperação, ignora este email.</p>`,
  });
}

module.exports = { enviarCodigoRecuperacao };
