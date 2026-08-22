import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Conta } from '../types/Conta';
import { contaService } from '../services/contaService';
import {
  NOMES_MESES,
  anosDisponiveis,
  contasDoPeriodo,
  formatarReal,
  gastosPorMes,
  somarContas,
} from '../utils/historicoHelpers';
import './Historico.css';

const TETO_KEY = 'subtracker-teto-mes';

export function Historico() {
  const hoje = new Date();
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState<number | 'todos'>(hoje.getMonth() + 1);
  const [teto, setTeto] = useState(() => {
    const salvo = localStorage.getItem(TETO_KEY);
    return salvo ? Number(salvo) : 0;
  });
  const [tetoInput, setTetoInput] = useState(() => {
    const salvo = localStorage.getItem(TETO_KEY);
    return salvo ?? '';
  });

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await contaService.listar();
        setContas(dados);
      } catch {
        setErro('Não deu para carregar o histórico.');
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const contasFiltradas = useMemo(
    () => contasDoPeriodo(contas, ano, mes),
    [contas, ano, mes],
  );
  const resumo = useMemo(() => somarContas(contasFiltradas), [contasFiltradas]);
  const barras = useMemo(() => gastosPorMes(contas, ano), [contas, ano]);
  const anos = useMemo(() => anosDisponiveis(contas), [contas]);

  const tetoAtivo = teto > 0 && mes !== 'todos';
  const passouDoTeto = tetoAtivo && resumo.total > teto;
  const percentualTeto = tetoAtivo ? Math.min((resumo.total / teto) * 100, 100) : 0;

  function salvarTeto() {
    const valor = Number(tetoInput);
    if (Number.isNaN(valor) || valor < 0) {
      alert('Digite um valor válido para o teto.');
      return;
    }
    setTeto(valor);
    localStorage.setItem(TETO_KEY, String(valor));
  }

  const tituloPeriodo =
    mes === 'todos' ? `Ano de ${ano}` : `${NOMES_MESES[mes - 1]} de ${ano}`;

  return (
    <div className="historico-pagina">
      <header className="historico-topo">
        <div>
          <h1>Histórico</h1>
          <p>Compare os meses e veja se passou do limite que você combinou consigo mesmo.</p>
        </div>

        <div className="historico-filtros">
          <label>
            Mês
            <select
              value={mes}
              onChange={(e) => {
                const valor = e.target.value;
                setMes(valor === 'todos' ? 'todos' : Number(valor));
              }}
            >
              <option value="todos">Todos</option>
              {NOMES_MESES.map((nome, index) => (
                <option key={nome} value={index + 1}>
                  {nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ano
            <select value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              {anos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {carregando && <p>Carregando histórico...</p>}
      {erro && <p className="historico-erro">{erro}</p>}

      <section className="historico-mini">
        <article className="historico-card">
          <span>Gasto em {tituloPeriodo}</span>
          <strong>{formatarReal(resumo.total)}</strong>
          <small>{resumo.quantidade} conta(s) neste período</small>
        </article>

        <article className="historico-card">
          <span>Já paguei</span>
          <strong className="pago">{formatarReal(resumo.pago)}</strong>
          <small>Ainda falta {formatarReal(resumo.aberto)}</small>
        </article>

        <article className={`historico-card teto ${passouDoTeto ? 'estourou' : ''}`}>
          <span>Teto do mês</span>
          <div className="teto-form">
            <input
              type="number"
              min="0"
              placeholder="Ex: 500"
              value={tetoInput}
              onChange={(e) => setTetoInput(e.target.value)}
            />
            <button type="button" onClick={salvarTeto}>
              Guardar
            </button>
          </div>

          {mes === 'todos' ? (
            <small>Escolha um mês para comparar com o teto.</small>
          ) : teto <= 0 ? (
            <small>Defina um limite para o mês, tipo um combinado com você mesmo.</small>
          ) : (
            <>
              <div className="teto-barra" aria-hidden="true">
                <span style={{ width: `${percentualTeto}%` }} />
              </div>
              <small>
                {passouDoTeto
                  ? `Passou ${formatarReal(resumo.total - teto)} do teto de ${formatarReal(teto)}.`
                  : `Usou ${formatarReal(resumo.total)} de ${formatarReal(teto)}. Ainda cabem ${formatarReal(teto - resumo.total)}.`}
              </small>
            </>
          )}
        </article>
      </section>

      <section className="historico-card historico-grafico">
        <h2>Comparando {ano}</h2>
        <p>Toque numa barra para abrir aquele mês. A mais alta é a que pesou mais.</p>

        <div className="historico-barras">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barras} barCategoryGap="28%">
              <XAxis
                dataKey="sigla"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#667', fontSize: 13, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(21, 137, 181, 0.08)' }}
                formatter={(valor: number | string) => [formatarReal(Number(valor)), 'Gasto']}
                labelFormatter={(sigla) => {
                  const item = barras.find((barra) => barra.sigla === sigla);
                  return item ? `${item.nome} de ${ano}` : String(sigla);
                }}
              />
              <Bar dataKey="valor" radius={[10, 10, 10, 10]} maxBarSize={36}>
                {barras.map((item) => (
                  <Cell
                    key={item.mes}
                    cursor="pointer"
                    fill={mes === item.mes ? '#1589b5' : '#c5ced3'}
                    onClick={() => setMes(item.mes)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="historico-card">
        <h2>Contas de {tituloPeriodo}</h2>
        {contasFiltradas.length === 0 ? (
          <p className="historico-vazio">Nada neste período. Tente outro mês ou ano.</p>
        ) : (
          <ul className="historico-lista">
            {contasFiltradas.map((conta) => (
              <li key={conta.id}>
                <div>
                  <strong>{conta.nome}</strong>
                  <span>{conta.categoria} · {conta.data.split('-').reverse().join('/')}</span>
                </div>
                <em>{formatarReal(Number(conta.preco))}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
