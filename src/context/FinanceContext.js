import React, { createContext, useState } from 'react';

export const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [salarios, setSalarios] = useState([
    { id: 1, nome: 'Motorfind', responsavel: 'Jhon', valor: 1671.00 },
    { id: 2, nome: 'Casa Idosos', responsavel: 'Naty', valor: 1800.00 }
  ]);

  const [assinaturas, setAssinaturas] = useState([
    { id: 1, nome: 'Netflix', fatura: 'Cartão Nubank', responsavel: 'Naty', valor: 39.90, diaCobranca: 28 },
    { id: 2, nome: 'Disney+', fatura: 'Cartão Nubank', responsavel: 'Jhon', valor: 21.90, diaCobranca: 2 }
  ]);

  const [faturas, setFaturas] = useState([
    {
        id: 1, nome: 'Cartão Nubank', limite: 9450.00, dataFechamento: 16, dataVencimento: 23,
        pagamentos: [
        ],
        itens: [
        ]
    },
    {
        id: 2, nome: 'Cartão Mercado Pago', limite: 2500.00, dataFechamento: 9, dataVencimento: 16, // Limite adicionado aqui
        pagamentos: [
        ],
        itens: [
            { id: 201, data: '2025-06-12', nome: 'Galaxy Buds3', tipo: 'Eletrónicos', vezes: 18, valorTotal: 915.84, responsavel: 'Jhon' },
            { id: 202, data: '2025-10-22', nome: 'Fogão Vó', tipo: 'Eletrónicos', vezes: 18, valorTotal: 729, responsavel: 'Vó' },
            { id: 203, data: '2026-03-08', nome: 'IOF de rotativo', tipo: 'IOF', vezes: 1, valorTotal: 0.32, responsavel: 'Jhon' },
            { id: 204, data: '2026-03-08', nome: 'Juros do rotativo', tipo: 'IOF', vezes: 1, valorTotal: 0.94, responsavel: 'Jhon'}
        ]   
    }
  ]);

  const [pagamentos, setPagamentos] = useState([]);

  return (
    <FinanceContext.Provider value={{
      salarios, setSalarios,
      assinaturas, setAssinaturas,
      faturas, setFaturas,
      pagamentos, setPagamentos
    }}>
      {children}
    </FinanceContext.Provider>
  );
}