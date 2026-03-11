-- CreateTable
CREATE TABLE "Responsavel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Salario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    CONSTRAINT "Salario_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "limite" REAL NOT NULL,
    "dataFechamento" INTEGER NOT NULL,
    "dataVencimento" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ItemFatura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "vezes" INTEGER NOT NULL,
    "valorTotal" REAL NOT NULL,
    "faturaId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    CONSTRAINT "ItemFatura_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemFatura_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "diaCobranca" INTEGER NOT NULL,
    "faturaId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    CONSTRAINT "Assinatura_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assinatura_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    CONSTRAINT "Pagamento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Responsavel_nome_key" ON "Responsavel"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_nome_key" ON "Fatura"("nome");
