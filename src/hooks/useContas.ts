import { useCallback, useEffect, useRef, useState } from 'react';
import type { AtualizarContaPayload, Conta, CriarContaPayload } from '../types/Conta';
import { contaService } from '../services/contaService';
import { pluggyService } from '../services/pluggyService';
import { ApiError } from '../services/apiClient';

export function useContas() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [notificacao, setNotificacao] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mostrarNotificacao = useCallback((mensagem: string, duracao = 2000) => {
    setNotificacao(mensagem);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setNotificacao(null), duracao);
  }, []);

  const tratarErro = useCallback((error: unknown, fallback: string) => {
    const mensagem = error instanceof ApiError ? error.message : fallback;
    setErro(mensagem);
    return mensagem;
  }, []);

  const carregarContas = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const dados = await contaService.listar();
      setContas(dados);
    } catch (error) {
      tratarErro(error, 'Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  }, [tratarErro]);

  useEffect(() => {
    carregarContas();
  }, [carregarContas]);

  const criarConta = useCallback(
    async (payload: CriarContaPayload) => {
      const conta = await contaService.criar(payload);
      setContas((lista) => [...lista, conta]);
      mostrarNotificacao('Conta adicionada com sucesso!');
      return conta;
    },
    [mostrarNotificacao],
  );

  const atualizarConta = useCallback(
    async (id: number, payload: AtualizarContaPayload) => {
      const conta = await contaService.atualizar(id, payload);
      setContas((lista) => lista.map((item) => (item.id === id ? conta : item)));
      mostrarNotificacao('Conta atualizada com sucesso!');
      return conta;
    },
    [mostrarNotificacao],
  );

  const alternarStatus = useCallback(async (id: number) => {
    const contaAtual = contas.find((conta) => conta.id === id);
    if (!contaAtual) return;

    const conta = await contaService.atualizarStatus(id, !contaAtual.pago);
    setContas((lista) => lista.map((item) => (item.id === id ? conta : item)));
  }, [contas]);

  const removerConta = useCallback(
    async (id: number) => {
      await contaService.remover(id);
      setContas((lista) => lista.filter((item) => item.id !== id));
      mostrarNotificacao('Conta removida com sucesso!');
    },
    [mostrarNotificacao],
  );

  const importarDaPluggy = useCallback(
    async (itemId: string) => {
      mostrarNotificacao('Banco conectado! Importando assinaturas...', 5000);
      const resultado = await pluggyService.importarAssinaturas(itemId);
      await carregarContas();
      mostrarNotificacao(resultado.mensagem, 4000);
      return resultado;
    },
    [carregarContas, mostrarNotificacao],
  );

  return {
    contas,
    carregando,
    erro,
    notificacao,
    carregarContas,
    criarConta,
    atualizarConta,
    alternarStatus,
    removerConta,
    importarDaPluggy,
    mostrarNotificacao,
    tratarErro,
  };
}
