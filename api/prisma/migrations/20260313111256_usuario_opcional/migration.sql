-- DropForeignKey
ALTER TABLE "Assinatura" DROP CONSTRAINT "Assinatura_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "ItemFatura" DROP CONSTRAINT "ItemFatura_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "Pagamento" DROP CONSTRAINT "Pagamento_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "Pix" DROP CONSTRAINT "Pix_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "Salario" DROP CONSTRAINT "Salario_responsavelId_fkey";

-- DropIndex
DROP INDEX "Fatura_nome_key";

-- DropIndex
DROP INDEX "Responsavel_nome_key";

-- AlterTable
ALTER TABLE "Assinatura" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Fatura" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "ItemFatura" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Pix" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Responsavel" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Salario" ADD COLUMN     "usuarioId" INTEGER;

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salario" ADD CONSTRAINT "Salario_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salario" ADD CONSTRAINT "Salario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFatura" ADD CONSTRAINT "ItemFatura_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFatura" ADD CONSTRAINT "ItemFatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pix" ADD CONSTRAINT "Pix_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pix" ADD CONSTRAINT "Pix_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
