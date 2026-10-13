import { useEffect, useMemo, useState } from 'react';
import type { Conta, FaturaMesAtual } from '../types/Conta';
import { pluggyService } from '../services/pluggyService';
import { contaService } from '../services/contaService';
import {
  formatarData,
  formatarDinheiro,
  formatarPercentual,
  nomeParaExibicao,
} from '../utils/contaHelpers';
import './Relatorio.css';

function chaveNome(nome: string) {
  return nomeParaExibicao(nome).toLowerCase();
}

export function Fatura() {
  const [fatura, setFatura] = useState<FaturaMesAtual | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [dadosFatura, dadosContas] = await Promise.all([
          pluggyService.faturaMesAtual(),
          contaService.listar().catch(() => [] as Conta[]),
        ]);
        setFatura(dadosFatura);
        setContas(dadosContas);
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : 'Não foi possível carregar a fatura.';
        setErro(mensagem);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const nomesAssinaturas = useMemo(
    () => new Set(contas.map((conta) => chaveNome(conta.nome))),
    [contas],
  );

  const totalAssinaturas = useMemo(() => {
    if (!fatura) return 0;
    return fatura.lancamentos
      .filter((item) => nomesAssinaturas.has(chaveNome(item.nome)))
      .reduce((soma, item) => soma + item.valor, 0);
  }, [fatura, nomesAssinaturas]);

  return (
    <div className="relatorio-pagina">
      <h1>Fatura</h1>
      <p>Compras no cartão de crédito neste mês.</p>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="relatorio-erro">{erro}</p>}

      {fatura && (
        <>
          <section className="relatorio-resumo">
            <div>
              <span>Mês</span>
              <strong>{fatura.mes}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatarDinheiro(fatura.total)}</strong>
            </div>
            <div>
              <span>Em assinaturas</span>
              <strong>
                {formatarDinheiro(totalAssinaturas)}
                {fatura.total > 0 && (
                  <small className="relatorio-resumo-nota">
                    {formatarPercentual(totalAssinaturas, fatura.total)} da fatura
                  </small>
                )}
              </strong>
            </div>
            <div>
              <span>Vencimento</span>
              <strong>
                {fatura.vencimento ? formatarData(fatura.vencimento) : 'Não informado'}
              </strong>
            </div>
            {fatura.minimo != null && (
              <div>
                <span>Pagamento mínimo</span>
                <strong>{formatarDinheiro(fatura.minimo)}</strong>
              </div>
            )}
          </section>

          <section className="relatorio-card">
            <h2>{fatura.cartao || 'Cartão'}</h2>
            {fatura.lancamentos.length === 0 ? (
              <p className="relatorio-vazio">Nenhuma compra no cartão neste mês.</p>
            ) : (
              <ul className="relatorio-lista">
                {fatura.lancamentos.map((item, indice) => {
                  const assinatura = nomesAssinaturas.has(chaveNome(item.nome));

                  return (
                    <li key={`${item.data}-${item.nome}-${indice}`}>
                      <div>
                        <strong>
                          {item.nome}
                          {assinatura && <span className="relatorio-selo">Assinatura</span>}
                        </strong>
                        <span>{formatarData(item.data)}</span>
                      </div>
                      <em>{formatarDinheiro(item.valor)}</em>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
