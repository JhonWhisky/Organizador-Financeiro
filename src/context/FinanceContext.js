import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

export const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  // Agora todos os estados começam vazios! A API é a nossa única fonte da verdade.
  const [responsaveis, setResponsaveis] = useState([]);
  const [salarios, setSalarios] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [faturas, setFaturas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [pix, setPix] = useState([]);

  // Estados de UI para feedback ao utilizador
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarDadosIniciais = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [resResp, resSal, resFat, resAss, resPag, resPix] = await Promise.all([
        api.get("/responsaveis"),
        api.get("/salarios"),
        api.get("/faturas"),
        api.get("/assinaturas"),
        api.get("/pagamentos"),
        api.get("/pix"),
      ]);

      setResponsaveis(resResp.data);

      setSalarios(
        resSal.data.map((sal) => ({
          ...sal,
          responsavel: sal.responsavel.nome,
        })),
      );

      setFaturas(
        resFat.data.map((fat) => ({
          ...fat,
          itens: fat.itens.map((item) => ({
            ...item,
            responsavel: item.responsavel
              ? item.responsavel.nome
              : "Não Informado",
          })),
        })),
      );

      setAssinaturas(
        resAss.data.map((ass) => ({
          ...ass,
          responsavel: ass.responsavel ? ass.responsavel.nome : "Não Informado",
          fatura: ass.fatura ? ass.fatura.nome : "Não Informada",
        })),
      );

      setPagamentos(
        resPag.data.map((pag) => ({
          ...pag,
          responsavel: pag.responsavel ? pag.responsavel.nome : "Não Informado",
        })),
      );

      setPix(
        resPix.data.map((p) => ({
          ...p,
          responsavel: p.responsavel ? p.responsavel.nome : "Não Informado",
        })),
      );
    } catch (error) {
      console.error("Erro ao carregar dados da API:", error);
      setErro(
        "Não foi possível carregar os teus dados. Verifica a tua ligação e tenta novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  return (
    <FinanceContext.Provider
      value={{
        responsaveis,
        setResponsaveis,
        salarios,
        setSalarios,
        assinaturas,
        setAssinaturas,
        faturas,
        setFaturas,
        pagamentos,
        setPagamentos,
        pix,
        setPix,
        carregando,
        erro,
        recarregar: carregarDadosIniciais,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
