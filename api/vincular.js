const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function vincular() {
  // ATENÇÃO: Coloca aqui EXATAMENTE o email com que te acabaste de registar
  const MEU_EMAIL = 'jhonatangrabelo@gmail.com'; 

  const user = await prisma.usuario.findUnique({ where: { email: MEU_EMAIL } });
  if (!user) return console.log('❌ Utilizador não encontrado. Verifica o email!');

  const id = user.id;

  // Atualiza todos os registos que estão "órfãos" (usuarioId = null) para o teu ID
  await prisma.responsavel.updateMany({ where: { usuarioId: null }, data: { usuarioId: id } });
  await prisma.salario.updateMany({ where: { usuarioId: null }, data: { usuarioId: id } });
  await prisma.fatura.updateMany({ where: { usuarioId: null }, data: { usuarioId: id } });
  await prisma.itemFatura.updateMany({ where: { usuarioId: null }, data: { usuarioId: id } });
  await prisma.assinatura.updateMany({ where: { usuarioId: null }, data: { usuarioId: id } });
  await prisma.pagamento.updateMany({ where: { usuarioId: null }, data: { usuarioId: id } });
  await prisma.pix.updateMany({ where: { usuarioId: null }, data: { usuarioId: id } });

  console.log(`✅ Sucesso! Todos os dados antigos pertencem agora à conta: ${MEU_EMAIL}`);
}

vincular()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());