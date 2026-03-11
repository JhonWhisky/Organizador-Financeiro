import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  // Agora todos os estados começam vazios! A API é a nossa única fonte da verdade.
  const [responsaveis, setResponsaveis] = useState([]);
  const [salarios, setSalarios] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [faturas, setFaturas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      const [resResp, resSal, resFat, resAss, resPag] = await Promise.all([
        api.get('/responsaveis'),
        api.get('/salarios'),
        api.get('/faturas'),
        api.get('/assinaturas'),
        api.get('/pagamentos')
      ]);
      
      setResponsaveis(resResp.data);
      
      setSalarios(resSal.data.map(sal => ({ ...sal, responsavel: sal.responsavel.nome })));
      
      setFaturas(resFat.data.map(fat => ({
        ...fat,
        itens: fat.itens.map(item => ({ ...item, responsavel: item.responsavel ? item.responsavel.nome : 'Não Informado' }))
      })));

      setAssinaturas(resAss.data.map(ass => ({
        ...ass, 
        responsavel: ass.responsavel ? ass.responsavel.nome : 'Não Informado',
        fatura: ass.fatura ? ass.fatura.nome : 'Não Informada'
      })));

      setPagamentos(resPag.data.map(pag => ({
        ...pag, responsavel: pag.responsavel ? pag.responsavel.nome : 'Não Informado'
      })));

    } catch (error) {
      console.error("Erro ao carregar dados da API:", error);
    }
  };

  return (
    <FinanceContext.Provider value={{
      responsaveis, setResponsaveis, salarios, setSalarios,
      assinaturas, setAssinaturas, faturas, setFaturas,
      pagamentos, setPagamentos
    }}>
      {children}
    </FinanceContext.Provider>
  );
}