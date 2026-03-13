/*
  Warnings:

  - A unique constraint covering the columns `[nome,usuarioId]` on the table `Responsavel` will be added. If there are existing duplicate values, this will fail.
  - Made the column `usuarioId` on table `Assinatura` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usuarioId` on table `Fatura` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usuarioId` on table `ItemFatura` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usuarioId` on table `Pagamento` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usuarioId` on table `Pix` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usuarioId` on table `Responsavel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usuarioId` on table `Salario` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Assinatura" ALTER COLUMN "usuarioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Fatura" ALTER COLUMN "usuarioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ItemFatura" ALTER COLUMN "usuarioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Pagamento" ALTER COLUMN "usuarioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Pix" ALTER COLUMN "usuarioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Responsavel" ALTER COLUMN "usuarioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Salario" ALTER COLUMN "usuarioId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Responsavel_nome_usuarioId_key" ON "Responsavel"("nome", "usuarioId");
