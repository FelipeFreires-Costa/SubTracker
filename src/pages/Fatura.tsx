import { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaCreditCard, FaPercentage, FaReceipt, FaShoppingBag } from 'react-icons/fa';
import type { Conta, FaturaMesAtual, LancamentoFatura } from '../types/Conta';
import { pluggyService } from '../services/pluggyService';
import { contaService } from '../services/contaService';
import { iconeDaConta } from '../utils/categoriaIcones';
import {
  formatarData,
  formatarDinheiro,
  formatarPercentual,
  nomeParaExibicao,
} from '../utils/contaHelpers';
import './Fatura.css';

type FiltroFatura = 'todas' | 'assinaturas' | 'outras';

function chaveNome(nome: string) {
  return nomeParaExibicao(nome).toLowerCase();
}

function rotuloMes(mesIso: string) {
  if (!mesIso || mesIso.length < 7) return mesIso;
  const data = new Date(`${mesIso.slice(0, 7)}-01T00:00:00`);
  if (Number.isNaN(data.getTime())) return mesIso;
  const rotulo = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}

function agruparPorData(lancamentos: Array<LancamentoFatura & { assinatura: boolean; indice: number }>) {
  const grupos = new Map<string, typeof lancamentos>();
  for (const item of lancamentos) {
    const chave = item.data || 'sem-data';
    const lista = grupos.get(chave) ?? [];
    lista.push(item);
    grupos.set(chave, lista);
  }
  return [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

function rotuloPapel(papel: 'anterior' | 'atual' | 'proxima') {
  if (papel === 'proxima') return 'Próxima';
  if (papel === 'atual') return 'Atual';
  return null;
}

export function Fatura() {
  const [fatura, setFatura] = useState<FaturaMesAtual | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroFatura>('todas');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    contaService.listar().then(setContas).catch(() => setContas([]));
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const dadosFatura = await pluggyService.faturaMesAtual(mesSelecionado);
        if (cancelado) return;
        setFatura(dadosFatura);
        if (!mesSelecionado && dadosFatura.mesChave) {
          setMesSelecionado(dadosFatura.mesChave);
        }
      } catch (error) {
        if (cancelado) return;
        const mensagem = error instanceof Error ? error.message : 'Não foi possível carregar a fatura.';
        setErro(mensagem);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [mesSelecionado]);

  const nomesAssinaturas = useMemo(
    () => new Set(contas.map((conta) => chaveNome(conta.nome))),
    [contas],
  );

  const lancamentosEnriquecidos = useMemo(() => {
    if (!fatura) return [];
    return fatura.lancamentos.map((item, indice) => ({
      ...item,
      indice,
      assinatura: nomesAssinaturas.has(chaveNome(item.nome)),
    }));
  }, [fatura, nomesAssinaturas]);

  const totalAssinaturas = useMemo(
    () =>
      lancamentosEnriquecidos
        .filter((item) => item.assinatura)
        .reduce((soma, item) => soma + item.valor, 0),
    [lancamentosEnriquecidos],
  );

  const qtdAssinaturas = useMemo(
    () => lancamentosEnriquecidos.filter((item) => item.assinatura).length,
    [lancamentosEnriquecidos],
  );

  const filtrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return lancamentosEnriquecidos.filter((item) => {
      if (filtro === 'assinaturas' && !item.assinatura) return false;
      if (filtro === 'outras' && item.assinatura) return false;
      if (!texto) return true;
      return item.nome.toLowerCase().includes(texto);
    });
  }, [lancamentosEnriquecidos, filtro, busca]);

  const grupos = useMemo(() => agruparPorData(filtrados), [filtrados]);

  return (
    <div className="fatura-pagina">
      <header className="fatura-cabecalho">
        <h1>Fatura</h1>
        <p>Resumo da fatura do cartão e dos lançamentos do período.</p>
      </header>

      {carregando && <p className="fatura-carregando">Carregando fatura...</p>}
      {erro && <p className="fatura-erro">{erro}</p>}

      {!carregando && !erro && !fatura && (
        <p className="fatura-vazio">Nenhuma fatura disponível no momento.</p>
      )}

      {fatura && (
        <>
          {fatura.periodos?.length > 0 && (
            <nav className="fatura-meses" aria-label="Períodos da fatura">
              {fatura.periodos.map((periodo) => {
                const ativa = (mesSelecionado ?? fatura.mesChave) === periodo.chave;
                const selo = rotuloPapel(periodo.papel);
                return (
                  <button
                    key={periodo.chave}
                    type="button"
                    className={`fatura-mes-aba ${ativa ? 'ativa' : ''}`}
                    onClick={() => {
                      setFiltro('todas');
                      setBusca('');
                      setMesSelecionado(periodo.chave);
                    }}
                  >
                    <strong>{periodo.rotulo}</strong>
                    {selo && <span>{selo}</span>}
                  </button>
                );
              })}
            </nav>
          )}

          <section className="fatura-hero" aria-label="Resumo da fatura">
            <div className="fatura-hero-topo">
              <div className="fatura-hero-marca">
                <i aria-hidden="true">
                  <FaCreditCard />
                </i>
                <div>
                  Cartão
                  <strong>
                    {fatura.cartao
                      ? fatura.cartao.charAt(0).toUpperCase() + fatura.cartao.slice(1)
                      : 'Cartão de crédito'}
                  </strong>
                </div>
              </div>
              <span className="fatura-hero-selo">
                {fatura.mes || rotuloMes(fatura.mesChave)}
              </span>
            </div>

            <div className="fatura-hero-valor">
              <span>Total da fatura</span>
              <strong>{formatarDinheiro(fatura.total)}</strong>
            </div>

            <div className="fatura-hero-meta">
              <div>
                <span>Vencimento</span>
                <strong>
                  {fatura.vencimento ? formatarData(fatura.vencimento) : 'Não informado'}
                </strong>
              </div>
              <div>
                <span>Pagamento mínimo</span>
                <strong>
                  {fatura.minimo != null ? formatarDinheiro(fatura.minimo) : '—'}
                </strong>
              </div>
              <div>
                <span>Lançamentos</span>
                <strong>{fatura.lancamentos.length}</strong>
              </div>
            </div>
          </section>

          <section className="fatura-stats" aria-label="Indicadores da fatura">
            <article className="fatura-stat destaque">
              <span className="fatura-stat-topo">
                <FaPercentage size={13} aria-hidden="true" />
                Em assinaturas
              </span>
              <strong>{formatarDinheiro(totalAssinaturas)}</strong>
              <em>
                {fatura.total > 0
                  ? `${formatarPercentual(totalAssinaturas, fatura.total)} da fatura`
                  : 'Sem total no período'}
              </em>
            </article>
            <article className="fatura-stat">
              <span className="fatura-stat-topo">
                <FaReceipt size={13} aria-hidden="true" />
                Assinaturas na fatura
              </span>
              <strong>
                {qtdAssinaturas} de {fatura.lancamentos.length}
              </strong>
              <em>cruzadas com as contas monitoradas</em>
            </article>
            <article className="fatura-stat">
              <span className="fatura-stat-topo">
                <FaCalendarAlt size={13} aria-hidden="true" />
                Outras compras
              </span>
              <strong>{formatarDinheiro(Math.max(fatura.total - totalAssinaturas, 0))}</strong>
              <em>{fatura.lancamentos.length - qtdAssinaturas} lançamentos</em>
            </article>
          </section>

          <section className="fatura-painel">
            <div className="fatura-painel-topo">
              <div>
                <h2>Lançamentos</h2>
                <p>
                  {filtrados.length} de {fatura.lancamentos.length} neste filtro
                </p>
              </div>
            </div>

            <div className="fatura-filtros">
              <input
                type="search"
                placeholder="Buscar lançamento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar lançamento"
              />
              <button
                type="button"
                className={`fatura-chip ${filtro === 'todas' ? 'ativa' : ''}`}
                onClick={() => setFiltro('todas')}
              >
                Todas
              </button>
              <button
                type="button"
                className={`fatura-chip ${filtro === 'assinaturas' ? 'ativa' : ''}`}
                onClick={() => setFiltro('assinaturas')}
              >
                Assinaturas
              </button>
              <button
                type="button"
                className={`fatura-chip ${filtro === 'outras' ? 'ativa' : ''}`}
                onClick={() => setFiltro('outras')}
              >
                Outras
              </button>
            </div>

            {filtrados.length === 0 ? (
              <p className="fatura-vazio">
                {fatura.lancamentos.length === 0
                  ? 'Nenhuma compra no cartão neste período.'
                  : 'Nenhum lançamento corresponde ao filtro.'}
              </p>
            ) : (
              <ul className="fatura-lista">
                {grupos.map(([data, itens]) => (
                  <li key={data}>
                    <div className="fatura-grupo-titulo">
                      {data === 'sem-data' ? 'Sem data' : formatarData(data)}
                    </div>
                    {itens.map((item) => (
                      <div
                        key={`${item.data}-${item.nome}-${item.indice}`}
                        className="fatura-item"
                      >
                        <span
                          className={`fatura-item-icone ${item.assinatura ? 'assinatura' : ''}`}
                          aria-hidden="true"
                        >
                          {item.assinatura ? (
                            iconeDaConta(undefined, item.nome, 18)
                          ) : (
                            <FaShoppingBag />
                          )}
                        </span>
                        <div className="fatura-item-info">
                          <strong>
                            {nomeParaExibicao(item.nome)}
                            {item.assinatura && <span className="fatura-selo">Assinatura</span>}
                          </strong>
                          <span>{item.assinatura ? 'Recorrência monitorada' : 'Compra no cartão'}</span>
                        </div>
                        <em className="fatura-item-valor">{formatarDinheiro(item.valor)}</em>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="fatura-nota">
            Tela auxiliar de consulta da fatura. Pagamento de fatura/boleto não é classificado como
            despesa recorrente na avaliação do algoritmo.
          </p>
        </>
      )}
    </div>
  );
}
