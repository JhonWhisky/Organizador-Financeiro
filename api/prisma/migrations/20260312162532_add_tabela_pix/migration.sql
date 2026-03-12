-- CreateTable
CREATE TABLE "Pix" (
    "id" SERIAL NOT NULL,
    "data" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavelId" INTEGER NOT NULL,

    CONSTRAINT "Pix_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pix" ADD CONSTRAINT "Pix_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
