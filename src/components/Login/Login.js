// ==========================================
// ROTAS DE RECUPERAÇÃO DE SENHA
// ==========================================

// 1. Solicitar código de recuperação
app.post('/auth/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(400).json({ error: 'Se este e-mail existir, um código foi enviado.' }); // Mensagem genérica por segurança

    // Gera um código numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    // Define a expiração para 15 minutos a partir de agora
    const expiracao = new Date(Date.now() + 15 * 60000);

    // Guarda o código no utilizador
    await prisma.usuario.update({
      where: { email },
      data: { codigoRecuperacao: codigo, expiracaoCodigo: expiracao }
    });

    // ⚠️ EM PRODUÇÃO: Aqui usarias o Nodemailer para enviar o 'codigo' por e-mail.
    // Para facilitar os teus testes agora, vamos enviar o código de volta na resposta:
    res.json({ 
      message: 'Código gerado com sucesso!', 
      codigoParaTeste: codigo // Apaga isto quando implementares o envio por e-mail real!
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao solicitar recuperação.' });
  }
});

// 2. Redefinir a senha com o código
app.post('/auth/redefinir-senha', async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body;
    
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    
    // Verifica se o código bate certo
    if (!usuario || usuario.codigoRecuperacao !== codigo) {
      return res.status(400).json({ error: 'Código inválido ou incorreto.' });
    }

    // Verifica se o código já expirou
    if (new Date() > usuario.expiracaoCodigo) {
      return res.status(400).json({ error: 'Este código já expirou. Pede um novo.' });
    }

    // Encripta a nova senha
    const salt = await bcrypt.genSalt(10);
    const senhaEncriptada = await bcrypt.hash(novaSenha, salt);

    // Salva a nova senha e apaga o código de recuperação para não ser usado de novo
    await prisma.usuario.update({
      where: { email },
      data: { 
        senha: senhaEncriptada, 
        codigoRecuperacao: null, 
        expiracaoCodigo: null 
      }
    });

    res.json({ message: 'Senha redefinida com sucesso! Já podes fazer login.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao redefinir a senha.' });
  }
});