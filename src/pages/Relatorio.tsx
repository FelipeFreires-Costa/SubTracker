import { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Conta, ConexaoPluggyStatus, RelatorioAvaliacaoHeuristica } from '../types/Conta';
import { contaService } from '../services/contaService';
import { pluggyService } from '../services/pluggyService';
import {
  custoAnual,
  custoMensal,
  dataDeAlerta,
  ehParcela,
  formatarData,
  formatarDinheiro,
  formatarPercentual,
  nomeParaExibicao,
  proximasCobrancas,
  resumoDeGastos,
  rotuloPeriodicidade,
  verificarSituacao,
} from '../utils/contaHelpers';
import './Relatorio.css';

const CORES = ['#5a7d9a', '#9b8ab8', '#3d7a75', '#c4a35a', '#6b8e6b', '#4a6880'];

const ESTILO_TOOLTIP = {
  background: '#121212',
  border: '1px solid #222222',
  borderRadius: '3px',
  color: '#eef1f6',
};

export function Relatorio() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [avaliacao, setAvaliacao] = useState<RelatorioAvaliacaoHeuristica | null>(null);
  const [conexao, setConexao] = useState<ConexaoPluggyStatus | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const dados = await contaService.listar();
        setContas(dados);
      } catch {
        setErro('Não foi possível carregar o relatório.');
      } finally {
        setCarregando(false);
      }

      try {
        setAvaliacao(await pluggyService.avaliacaoHeuristica());
      } catch {
        setAvaliacao(null);
      }

      try {
        setConexao(await pluggyService.statusConexao());
      } catch {
        setConexao(null);
      }
    }

    carregarDados();
  }, []);

  const assinaturas = useMemo(() => contas.filter((conta) => !ehParcela(conta)), [contas]);
  const gastos = useMemo(() => resumoDeGastos(assinaturas), [assinaturas]);
  const ranking = useMemo(
    () => [...assinaturas].sort((a, b) => custoMensal(b) - custoMensal(a)),
    [assinaturas],
  );
  const maior = ranking[0];
  const proximas = useMemo(() => proximasCobrancas(assinaturas, 30), [assinaturas]);
  const totalProximas = proximas.reduce((soma, conta) => soma + Number(conta.preco), 0);

  const dadosPizza = useMemo(() => {
    const porCategoria = assinaturas.reduce<Record<string, number>>((acumulador, conta) => {
      const categoria = conta.categoria || 'Outros';
      acumulador[categoria] = (acumulador[categoria] ?? 0) + custoMensal(conta);
      return acumulador;
    }, {});

    return Object.entries(porCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [assinaturas]);

  return (
    <div className="relatorio-pagina">
      <h1>Relatório</h1>
      <p>Quanto suas assinaturas custam e para onde vai o dinheiro.</p>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="relatorio-erro">{erro}</p>}

      <section className="relatorio-resumo">
        <div>
          <span>Por mês</span>
          <strong>{formatarDinheiro(gastos.porMes)}</strong>
        </div>
        <div>
          <span>Por ano</span>
          <strong>{formatarDinheiro(gastos.porAno)}</strong>
        </div>
        <div>
          <span>Assinaturas</span>
          <strong>{assinaturas.length}</strong>
        </div>
        <div>
          <span>Maior gasto</span>
          <strong>
            {maior
              ? `${nomeParaExibicao(maior.nome)} · ${formatarDinheiro(custoMensal(maior))}/mês`
              : '—'}
          </strong>
        </div>
      </section>

      <div className="relatorio-grade">
        <section className="relatorio-card">
          <h2>Por categoria</h2>
          {dadosPizza.length === 0 ? (
            <p className="relatorio-vazio">Nenhuma assinatura ainda.</p>
          ) : (
            <>
              <div className="relatorio-pizza">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dadosPizza.map((fatia, index) => (
                        <Cell key={fatia.name} fill={CORES[index % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${formatarDinheiro(Number(value))}/mês`,
                        String(name),
                      ]}
                      contentStyle={ESTILO_TOOLTIP}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="relatorio-legendas">
                {dadosPizza.map((fatia, index) => (
                  <li key={fatia.name}>
                    <span className="relatorio-legenda-nome">
                      <i style={{ background: CORES[index % CORES.length] }} />
                      {fatia.name}
                    </span>
                    <em>
                      {formatarDinheiro(fatia.value)}
                      <small>{formatarPercentual(fatia.value, gastos.porMes)}</small>
                    </em>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="relatorio-card">
          <h2>Quanto cada uma custa</h2>
          {ranking.length === 0 ? (
            <p className="relatorio-vazio">Nenhuma assinatura ainda.</p>
          ) : (
            <ul className="relatorio-lista relatorio-ranking">
              {ranking.map((conta) => {
                const mensal = custoMensal(conta);
                const largura = gastos.porMes > 0 ? (mensal / gastos.porMes) * 100 : 0;

                return (
                  <li key={conta.id}>
                    <div className="relatorio-ranking-topo">
                      <div>
                        <strong>{nomeParaExibicao(conta.nome)}</strong>
                        <span>
                          {[
                            rotuloPeriodicidade(conta.periodicidade),
                            `${formatarDinheiro(custoAnual(conta))} por ano`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                      <em>
                        {formatarDinheiro(mensal)}/mês
                        <small>{formatarPercentual(mensal, gastos.porMes)} do total</small>
                      </em>
                    </div>
                    <div className="relatorio-barra" aria-hidden="true">
                      <div style={{ width: `${Math.max(largura, 2)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="relatorio-card relatorio-proximas">
        <h2>
          Próximos 30 dias
          {proximas.length > 0 && <span>{formatarDinheiro(totalProximas)}</span>}
        </h2>
        {proximas.length === 0 ? (
          <p className="relatorio-vazio">Nenhuma cobrança prevista nos próximos 30 dias.</p>
        ) : (
          <ul className="relatorio-lista">
            {proximas.map((conta) => {
              const vencimento = dataDeAlerta(conta);
              const atrasada = !conta.pago && verificarSituacao(vencimento) === 'vencida';

              return (
                <li key={conta.id}>
                  <div>
                    <strong>{nomeParaExibicao(conta.nome)}</strong>
                    <span className={atrasada ? 'relatorio-atrasada' : ''}>
                      {atrasada ? `Atrasada desde ${formatarData(vencimento)}` : formatarData(vencimento)}
                    </span>
                  </div>
                  <em>{formatarDinheiro(Number(conta.preco))}</em>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {conexao?.conectado && conexao.ultimaSincronizacao && (
        <p className="relatorio-nota">
          Banco atualizado em {new Date(conexao.ultimaSincronizacao).toLocaleDateString('pt-BR')}.
        </p>
      )}

      {avaliacao && (
        <details className="relatorio-tecnico">
          <summary>Como a detecção automática foi testada</summary>
          <p>
            Em {avaliacao.totalCasos} casos de teste, a detecção acertou {avaliacao.acuracia}% das
            contas.
            {avaliacao.linhaDeBase
              ? ` Considerando apenas nomes repetidos no extrato, o acerto seria de ${avaliacao.linhaDeBase.acuracia}%.`
              : ''}
          </p>
          <ul>
            {avaliacao.linhas.map((linha) => (
              <li key={linha.nome}>
                {linha.nome}
                <span>{linha.veredito === 'VP' || linha.veredito === 'VN' ? 'Acertou' : 'Errou'}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
