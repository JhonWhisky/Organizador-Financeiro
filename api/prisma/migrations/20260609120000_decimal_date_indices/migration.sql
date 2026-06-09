-- Converte valores monetários de Float (double precision) para Decimal(12,2)
ALTER TABLE "Salario" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Fatura" ALTER COLUMN "limite" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "ItemFatura" ALTER COLUMN "valorTotal" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Assinatura" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Pagamento" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Pix" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(12,2);

-- Converte datas armazenadas como texto ('AAAA-MM-DD') para o tipo DATE
ALTER TABLE "ItemFatura" ALTER COLUMN "data" SET DATA TYPE DATE USING "data"::date;
ALTER TABLE "Pix" ALTER COLUMN "data" SET DATA TYPE DATE USING "data"::date;

-- Índices nas chaves estrangeiras usadas em todas as consultas
CREATE INDEX "Responsavel_usuarioId_idx" ON "Responsavel"("usuarioId");
CREATE INDEX "Salario_usuarioId_idx" ON "Salario"("usuarioId");
CREATE INDEX "Salario_responsavelId_idx" ON "Salario"("responsavelId");
CREATE INDEX "Fatura_usuarioId_idx" ON "Fatura"("usuarioId");
CREATE INDEX "ItemFatura_usuarioId_idx" ON "ItemFatura"("usuarioId");
CREATE INDEX "ItemFatura_faturaId_idx" ON "ItemFatura"("faturaId");
CREATE INDEX "ItemFatura_responsavelId_idx" ON "ItemFatura"("responsavelId");
CREATE INDEX "Assinatura_usuarioId_idx" ON "Assinatura"("usuarioId");
CREATE INDEX "Assinatura_faturaId_idx" ON "Assinatura"("faturaId");
CREATE INDEX "Assinatura_responsavelId_idx" ON "Assinatura"("responsavelId");
CREATE INDEX "Pagamento_usuarioId_idx" ON "Pagamento"("usuarioId");
CREATE INDEX "Pagamento_responsavelId_idx" ON "Pagamento"("responsavelId");
CREATE INDEX "Pix_usuarioId_idx" ON "Pix"("usuarioId");
CREATE INDEX "Pix_responsavelId_idx" ON "Pix"("responsavelId");
