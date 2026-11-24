import { useMemo, useState } from 'react';
import {
  FaBullseye,
  FaCheckDouble,
  FaFlask,
  FaPercentage,
  FaBalanceScale,
} from 'react-icons/fa';
import {
  demoAcademicaService,
  type CasoDemoResultado,
  type DatasetDemo,
  type MetricasDemo,
  type ResultadoDemo,
} from '../services/demoAcademicaService';
import { formatarDinheiro } from '../utils/contaHelpers';
import './DemonstracaoAcademica.css';

type Aba = 'visao' | 'algoritmo' | 'resultados' | 'sobre';
type Filtro = 'todas' | 'recorrentes' | 'nao';

function formatarPct(valor: number) {
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function DemonstracaoAcademica() {
  const [aba, setAba] = useState<Aba>('visao');
  const [dataset, setDataset] = useState<DatasetDemo | null>(null);
  const [resultado, setResultado] = useState<ResultadoDemo | null>(null);
  const [metricas, setMetricas] = useState<MetricasDemo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const casosTabela: CasoDemoResultado[] = useMemo(() => {
    if (!resultado) return [];
    const texto = busca.trim().toLowerCase();
    return resultado.casos.filter((caso) => {
      if (filtro === 'recorrentes' && caso.obtido !== 'recorrente') return false;
      if (filtro === 'nao' && caso.obtido !== 'eventual') return false;
      if (!texto) return true;
      return (
        caso.nome.toLowerCase().includes(texto) ||
        caso.transacoes.some((t) => t.descricao.toLowerCase().includes(texto))
      );
    });
  }, [resultado, filtro, busca]);

  const selecionado = resultado?.casos.find((c) => c.id === selecionadoId) ?? null;

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await demoAcademicaService.dataset();
      setDataset(dados);
      setResultado(null);
      setSelecionadoId(null);
      setAba('algoritmo');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar dados de demonstração.');
    } finally {
      setCarregando(false);
    }
  }

  async function executarIdentificacao() {
    setCarregando(true);
    setErro(null);
    try {
      if (!dataset) {
        const dados = await demoAcademicaService.dataset();
        setDataset(dados);
      }
      const saida = await demoAcademicaService.executar();
      setResultado(saida);
      setSelecionadoId(saida.casos[0]?.id ?? null);
      setAba('algoritmo');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao executar a identificação.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarMetricas() {
    if (metricas) return;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await demoAcademicaService.metricas();
      setMetricas(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar métricas oficiais.');
    } finally {
      setCarregando(false);
    }
  }

  function encerrarDemonstracao() {
    const ok = window.confirm(
      'Encerrar a demonstração? Somente o estado temporário desta página será limpo. Contas, Pluggy e banco permanecem intactos.',
    );
    if (!ok) return;
    setDataset(null);
    setResultado(null);
    setSelecionadoId(null);
    setBusca('');
    setFiltro('todas');
    setErro(null);
    setAba('visao');
  }

  const indicadores = resultado
    ? {
        transacoes: resultado.resumo.transacoesAnalisadas,
        recorrentes: resultado.resumo.recorrentesIdentificados,
        nao: resultado.resumo.naoRecorrentesIdentificados,
        casos: resultado.resumo.casosAnalisados,
      }
    : dataset
      ? {
          transacoes: dataset.totalTransacoes,
          recorrentes: dataset.recorrentesEsperados,
          nao: dataset.naoRecorrentesEsperados,
          casos: dataset.totalCasos,
        }
      : null;

  return (
    <div className="demo-pagina">
      <header className="demo-cabecalho">
        <h1>Demonstração Acadêmica</h1>
        <p>
          Ambiente de demonstração do processo de identificação de despesas recorrentes e dos
          resultados experimentais do SubTracker.
        </p>
        <div className="demo-selo">
          <FaFlask size={14} aria-hidden="true" />
          Ambiente acadêmico — dados de demonstração e resultados experimentais.
        </div>
      </header>

      <nav className="demo-abas" aria-label="Seções da demonstração">
        <button type="button" className={aba === 'visao' ? 'ativa' : ''} onClick={() => setAba('visao')}>
          Visão geral
        </button>
        <button
          type="button"
          className={aba === 'algoritmo' ? 'ativa' : ''}
          onClick={() => setAba('algoritmo')}
        >
          Demonstração do algoritmo
        </button>
        <button
          type="button"
          className={aba === 'resultados' ? 'ativa' : ''}
          onClick={() => {
            setAba('resultados');
            void carregarMetricas();
          }}
        >
          Resultados experimentais
        </button>
        <button
          type="button"
          className={aba === 'sobre' ? 'ativa' : ''}
          onClick={() => {
            setAba('sobre');
            void carregarMetricas();
          }}
        >
          Sobre a avaliação
        </button>
      </nav>

      {erro && <p className="demo-erro">{erro}</p>}

      {aba === 'visao' && (
        <section className="demo-card">
          <h2>Visão geral</h2>
          <p>
            Esta área é independente das telas Contas e Relatório. Serve para apresentar o
            classificador heurístico e as métricas documentadas no TCC 2, sem alterar dados reais.
          </p>

          {indicadores ? (
            <div className="demo-kpi-grid">
              <article className="demo-kpi">
                <span>Transações na demonstração</span>
                <strong>{indicadores.transacoes}</strong>
              </article>
              <article className="demo-kpi">
                <span>{resultado ? 'Identificadas como recorrentes' : 'Casos recorrentes (esperado)'}</span>
                <strong>{indicadores.recorrentes}</strong>
              </article>
              <article className="demo-kpi">
                <span>{resultado ? 'Identificadas como não recorrentes' : 'Casos não recorrentes (esperado)'}</span>
                <strong>{indicadores.nao}</strong>
              </article>
              <article className="demo-kpi">
                <span>Casos apresentados</span>
                <strong>{indicadores.casos}</strong>
              </article>
            </div>
          ) : (
            <div className="demo-aviso">
              Carregue os dados de demonstração na aba “Demonstração do algoritmo” para ver os
              indicadores do conjunto em memória.
            </div>
          )}

          <h3>Como funciona a identificação?</h3>
          <ol className="demo-passos">
            <li>O sistema recebe um conjunto de transações de saída.</li>
            <li>Normaliza a descrição e agrupa lançamentos pela mesma chave textual.</li>
            <li>Descarta ruído bancário, transferências a pessoa e parcelamentos.</li>
            <li>Analisa estabilidade de valor (tolerância por categoria) e intervalos entre datas.</li>
            <li>
              Classifica como recorrente quando há ciclo mensal, bimestral ou anual e o mínimo de
              ocorrências exigido (3; ou 2 se anual / categoria Subscriptions).
            </li>
          </ol>

          <div className="demo-aviso">
            Esta demonstração utiliza dados preparados para fins acadêmicos e não representa uma
            sincronização bancária real.
          </div>

          <div className="demo-acoes">
            <button type="button" className="primario" disabled={carregando} onClick={() => void carregarDados()}>
              Ir para demonstração
            </button>
            <button
              type="button"
              disabled={carregando}
              onClick={() => {
                setAba('resultados');
                void carregarMetricas();
              }}
            >
              Ver resultados oficiais
            </button>
          </div>
        </section>
      )}

      {aba === 'algoritmo' && (
        <section className="demo-card">
          <h2>Demonstração da identificação de recorrências</h2>
          <p>Visualize exemplos de transações analisadas e os resultados da classificação.</p>

          <div className="demo-acoes">
            <button type="button" className="primario" disabled={carregando} onClick={() => void carregarDados()}>
              Carregar dados de demonstração
            </button>
            <button type="button" disabled={carregando} onClick={() => void executarIdentificacao()}>
              Executar identificação
            </button>
            <button type="button" className="perigo" disabled={!dataset && !resultado} onClick={encerrarDemonstracao}>
              Encerrar demonstração
            </button>
          </div>

          {resultado && (
            <div className="demo-kpi-grid">
              <article className="demo-kpi">
                <span>Transações analisadas</span>
                <strong>{resultado.resumo.transacoesAnalisadas}</strong>
              </article>
              <article className="demo-kpi">
                <span>Recorrentes</span>
                <strong>{resultado.resumo.recorrentesIdentificados}</strong>
              </article>
              <article className="demo-kpi">
                <span>Não recorrentes</span>
                <strong>{resultado.resumo.naoRecorrentesIdentificados}</strong>
              </article>
              <article className="demo-kpi">
                <span>Tempo de execução</span>
                <strong>{resultado.resumo.tempoMs.toLocaleString('pt-BR')} ms</strong>
                <em>medido nesta execução</em>
              </article>
            </div>
          )}

          {dataset && !resultado && (
            <div className="demo-aviso">{dataset.aviso}</div>
          )}
          {resultado && <div className="demo-aviso">{resultado.aviso}</div>}

          {resultado && (
            <>
              <div className="demo-filtros">
                <input
                  type="search"
                  placeholder="Buscar por descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <button
                  type="button"
                  className={`demo-chip-filtro ${filtro === 'todas' ? 'ativa' : ''}`}
                  onClick={() => setFiltro('todas')}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={`demo-chip-filtro ${filtro === 'recorrentes' ? 'ativa' : ''}`}
                  onClick={() => setFiltro('recorrentes')}
                >
                  Recorrentes
                </button>
                <button
                  type="button"
                  className={`demo-chip-filtro ${filtro === 'nao' ? 'ativa' : ''}`}
                  onClick={() => setFiltro('nao')}
                >
                  Não recorrentes
                </button>
              </div>

              <div className="demo-tabela-wrap">
                <table className="demo-tabela">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Valor (última)</th>
                      <th>Ocorrências</th>
                      <th>Categoria</th>
                      <th>Classificação</th>
                      <th>Periodicidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casosTabela.map((caso) => {
                      const ultima = caso.transacoes[caso.transacoes.length - 1];
                      return (
                        <tr
                          key={caso.id}
                          className={selecionadoId === caso.id ? 'selecionada' : ''}
                          onClick={() => setSelecionadoId(caso.id)}
                        >
                          <td>{caso.nome}</td>
                          <td>{formatarDinheiro(Math.abs(ultima?.valor ?? 0))}</td>
                          <td>{caso.ocorrencias}</td>
                          <td>{caso.categoria ?? '—'}</td>
                          <td>
                            <span className={`demo-badge ${caso.obtido}`}>
                              {caso.obtidoRotulo}
                            </span>
                          </td>
                          <td>{caso.periodicidadeObtidaRotulo ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selecionado && (
                <div className="demo-painel">
                  <h3>{selecionado.nome}</h3>
                  <p className="demo-texto">{selecionado.explicacao}</p>
                  <dl>
                    <dt>Classificação</dt>
                    <dd>{selecionado.obtidoRotulo}</dd>
                    <dt>Periodicidade</dt>
                    <dd>{selecionado.periodicidadeObtidaRotulo ?? 'Não identificada'}</dd>
                    <dt>Ocorrências</dt>
                    <dd>{selecionado.ocorrencias}</dd>
                    <dt>Intervalos (dias)</dt>
                    <dd>
                      {selecionado.intervalosDias.length > 0
                        ? selecionado.intervalosDias.join(', ')
                        : '—'}
                    </dd>
                    <dt>Valores</dt>
                    <dd>
                      {selecionado.valores.map((v) => formatarDinheiro(v)).join(' · ')}
                    </dd>
                    <dt>Tolerância de valor</dt>
                    <dd>{(selecionado.toleranciaValor * 100).toFixed(0)}%</dd>
                    <dt>Valores estáveis</dt>
                    <dd>{selecionado.valoresEstaveis ? 'Sim' : 'Não'}</dd>
                    <dt>Filtros</dt>
                    <dd>
                      {[
                        selecionado.filtros.ruidoBancario ? 'ruído bancário' : null,
                        selecionado.filtros.transferenciaPessoa ? 'transferência a pessoa' : null,
                        selecionado.filtros.parcelamento ? 'parcelamento' : null,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'nenhum'}
                    </dd>
                  </dl>

                  <h3>Histórico relacionado</h3>
                  <div className="demo-tabela-wrap">
                    <table className="demo-tabela">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Descrição</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selecionado.transacoes.map((t) => (
                          <tr key={`${t.data}-${t.descricao}-${t.valor}`}>
                            <td>{t.data.split('-').reverse().join('/')}</td>
                            <td>{t.descricao}</td>
                            <td>{formatarDinheiro(Math.abs(t.valor))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {aba === 'resultados' && !metricas && (
        <section className="demo-card">
          <h2>Resultados da avaliação</h2>
          <p className="demo-texto">{carregando ? 'Carregando métricas oficiais...' : 'Não foi possível carregar as métricas.'}</p>
        </section>
      )}

      {aba === 'resultados' && metricas && (
        <>
          <section className="demo-card">
            <h2>Resultados da avaliação</h2>
            <p>
              Indicadores quantitativos obtidos durante a avaliação do mecanismo de identificação de
              despesas recorrentes.
            </p>
            <div className="demo-selo" style={{ marginTop: 12 }}>
              {metricas.experimental.identificacao}
            </div>
            <p className="demo-texto" style={{ marginTop: 10 }}>
              {metricas.experimental.perfis} perfis · {metricas.experimental.mesesPorPerfil} meses ·{' '}
              {metricas.experimental.totalCasos} casos ({metricas.experimental.recorrentes} recorrentes /{' '}
              {metricas.experimental.naoRecorrentes} não) · {metricas.experimental.totalTransacoes}{' '}
              transações · semente {metricas.experimental.semente}
            </p>

            <div className="demo-metricas-grid">
              <article className="demo-metrica">
                <div className="demo-metrica-topo">
                  Acurácia
                  <FaBullseye size={14} aria-hidden="true" />
                </div>
                <strong>{formatarPct(metricas.experimental.heuristica.acuracia)}</strong>
                <p>Proporção de classificações corretas entre todos os casos avaliados.</p>
              </article>
              <article className="demo-metrica">
                <div className="demo-metrica-topo">
                  Precisão
                  <FaPercentage size={14} aria-hidden="true" />
                </div>
                <strong>{formatarPct(metricas.experimental.heuristica.precisao)}</strong>
                <p>Proporção de identificações positivas que realmente eram recorrentes.</p>
              </article>
              <article className="demo-metrica">
                <div className="demo-metrica-topo">
                  Revocação
                  <FaCheckDouble size={14} aria-hidden="true" />
                </div>
                <strong>{formatarPct(metricas.experimental.heuristica.recall)}</strong>
                <p>Proporção dos casos recorrentes reais que foram identificados pelo sistema.</p>
              </article>
              <article className="demo-metrica">
                <div className="demo-metrica-topo">
                  F1-score
                  <FaBalanceScale size={14} aria-hidden="true" />
                </div>
                <strong>{formatarPct(metricas.experimental.heuristica.f1)}</strong>
                <p>Média harmônica entre precisão e revocação.</p>
              </article>
            </div>

            <h3>Matriz de confusão</h3>
            <p className="demo-texto">
              A matriz de confusão permite comparar as classificações realizadas pelo sistema com os
              resultados esperados para cada caso avaliado.
            </p>
            <div className="demo-matriz">
              <div />
              <div className="cabeca">Predito recorrente</div>
              <div className="cabeca">Predito não recorrente</div>
              <div className="rotulo">Real recorrente</div>
              <div className="celula">
                <strong>{metricas.experimental.matrizConfusao.realRecorrentePreditoRecorrente}</strong>
                <span>Verdadeiros positivos</span>
              </div>
              <div className="celula">
                <strong>{metricas.experimental.matrizConfusao.realRecorrentePreditoNao}</strong>
                <span>Falsos negativos</span>
              </div>
              <div className="rotulo">Real não recorrente</div>
              <div className="celula">
                <strong>{metricas.experimental.matrizConfusao.realNaoPreditoRecorrente}</strong>
                <span>Falsos positivos</span>
              </div>
              <div className="celula">
                <strong>{metricas.experimental.matrizConfusao.realNaoPreditoNao}</strong>
                <span>Verdadeiros negativos</span>
              </div>
            </div>
          </section>

          <section className="demo-card">
            <h2>Comparação de acurácia</h2>
            <p>
              Comparação entre o método desenvolvido e o método de referência utilizado na avaliação
              experimental (held-out 2027). Não é avaliação com usuários em produção.
            </p>
            <div className="demo-comparacao">
              <div className="demo-barra-comp">
                <span>Baseline</span>
                <div className="trilha">
                  <div
                    className="preenchimento base"
                    style={{ width: `${metricas.experimental.linhaDeBase.acuracia}%` }}
                  />
                </div>
                <em>{formatarPct(metricas.experimental.linhaDeBase.acuracia)}</em>
              </div>
              <div className="demo-barra-comp">
                <span>SubTracker</span>
                <div className="trilha">
                  <div
                    className="preenchimento"
                    style={{ width: `${metricas.experimental.heuristica.acuracia}%` }}
                  />
                </div>
                <em>{formatarPct(metricas.experimental.heuristica.acuracia)}</em>
              </div>
            </div>
            <p className="demo-texto" style={{ marginTop: 12 }}>
              Diferença:{' '}
              {(
                metricas.experimental.heuristica.acuracia - metricas.experimental.linhaDeBase.acuracia
              ).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
              pontos percentuais.
            </p>
            {metricas.estabilidade && (
              <div className="demo-aviso">
                Estabilidade complementar ({metricas.estabilidade.nSementes} sementes ×{' '}
                {metricas.estabilidade.nPorSemente} casos): acurácia média{' '}
                {metricas.estabilidade.meanAcc != null
                  ? formatarPct(metricas.estabilidade.meanAcc)
                  : '—'}{' '}
                (mín. {metricas.estabilidade.minAcc ?? '—'}% · máx. {metricas.estabilidade.maxAcc ?? '—'}
                %). FP total = {metricas.estabilidade.totalFP ?? '—'}.
              </div>
            )}
            <div className="demo-aviso">{metricas.experimental.observacao}</div>
          </section>

          <section className="demo-card">
            <h2>Conjunto de desenvolvimento (separado)</h2>
            <div className="demo-selo">{metricas.desenvolvimento.identificacao}</div>
            <p className="demo-texto" style={{ marginTop: 10 }}>
              {metricas.desenvolvimento.totalCasos} casos · {metricas.desenvolvimento.recorrentes}{' '}
              recorrentes / {metricas.desenvolvimento.naoRecorrentes} não ·{' '}
              {metricas.desenvolvimento.totalTransacoes} transações (+{' '}
              {metricas.desenvolvimento.ruidoForaAvaliacao} ruído fora da pontuação). Acurácia{' '}
              {formatarPct(metricas.desenvolvimento.acuracia)} — não é evidência independente.
            </p>
            <div className="demo-aviso">{metricas.desenvolvimento.observacao}</div>
          </section>
        </>
      )}

      {aba === 'sobre' && (
        <section className="demo-card">
          <h2>Metodologia de avaliação</h2>
          <p className="demo-texto">
            A avaliação quantitativa do classificador usou conjuntos sintéticos rotulados pelo tipo de
            cenário, independentes da saída do algoritmo. Os conjuntos não são misturados nem
            médios entre si.
          </p>

          <div className="demo-duas-colunas" style={{ marginTop: 14 }}>
            <div>
              <h3>Conjunto de desenvolvimento</h3>
              <ul className="demo-lista-criterios">
                <li>
                  <span>Casos</span>
                  <strong>21</strong>
                </li>
                <li>
                  <span>Recorrentes / não</span>
                  <strong>10 / 11</strong>
                </li>
                <li>
                  <span>Transações</span>
                  <strong>59 (+ 2 ruído)</strong>
                </li>
              </ul>
            </div>
            <div>
              <h3>Evidência formal (held-out)</h3>
              <ul className="demo-lista-criterios">
                <li>
                  <span>Semente</span>
                  <strong>2027</strong>
                </li>
                <li>
                  <span>Casos</span>
                  <strong>120 (60 / 60)</strong>
                </li>
                <li>
                  <span>Transações</span>
                  <strong>958</strong>
                </li>
              </ul>
            </div>
          </div>

          <h3>Critérios utilizados</h3>
          <ul className="demo-lista-criterios">
            <li>
              <span>Tolerância geral</span>
              <strong>15%</strong>
            </li>
            <li>
              <span>Tolerância de consumo</span>
              <strong>35%</strong>
            </li>
            <li>
              <span>Folga monetária</span>
              <strong>R$ 2,00</strong>
            </li>
            <li>
              <span>Intervalo mensal</span>
              <strong>25 a 36 dias</strong>
            </li>
            <li>
              <span>Intervalo bimestral</span>
              <strong>55 a 75 dias</strong>
            </li>
            <li>
              <span>Intervalo anual</span>
              <strong>340 a 390 dias</strong>
            </li>
          </ul>
          <p className="demo-texto" style={{ marginTop: 10 }}>
            Os parâmetros foram utilizados na identificação de padrões de recorrência, respeitando as
            características de cada periodicidade (regras congeladas em REGRAS-CONGELADAS.md).
          </p>

          <h3>Integração com Open Finance</h3>
          <p className="demo-texto">
            O SubTracker utiliza a integração com a Pluggy para obter dados financeiros autorizados,
            que podem ser utilizados no processo de identificação e organização de despesas
            recorrentes. Esta demonstração acadêmica não realiza nova autenticação nem sincronização
            Pluggy.
          </p>

          <h3>Limitações e considerações</h3>
          <div className="demo-aviso">
            Os resultados estão relacionados aos conjuntos de dados utilizados na avaliação. O
            desempenho observado não garante o mesmo comportamento para todos os históricos
            financeiros. A quantidade e a qualidade das transações disponíveis influenciam a
            identificação de padrões. A avaliação não deve ser interpretada como comprovação de
            desempenho universal.
          </div>

          {metricas?.avaliacaoReal && (
            <div className="demo-aviso" style={{ marginTop: 10 }}>
              {metricas.avaliacaoReal.observacao}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
