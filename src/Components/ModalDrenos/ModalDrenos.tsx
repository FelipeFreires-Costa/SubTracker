import { useEffect, useRef } from 'react';
import { FaCalendarAlt, FaChartBar, FaWallet } from 'react-icons/fa';
import { HiOutlineTrendingDown } from 'react-icons/hi';
import type { Conta } from '../../types/Conta';
import {
  custoMensal,
  formatarDinheiro,
  formatarMesAno,
  formatarPercentual,
  historicoGasto,
  nomeParaExibicao,
} from '../../utils/contaHelpers';
import '../ModalConfirmacao/ModalConfirmacao.css';
import './ModalDrenos.css';

interface ModalDrenosProps {
  aberto: boolean;
  contas: Conta[];
  gastoMensal: number;
  totalHistorico: number;
  onFechar: () => void;
}

export function ModalDrenos({
  aberto,
  contas,
  gastoMensal,
  totalHistorico,
  onFechar,
}: ModalDrenosProps) {
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    fecharRef.current?.focus();

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onFechar();
      }
    }

    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const ordenadas = [...contas].sort((a, b) => custoMensal(b) - custoMensal(a));

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div
        className="modal-box modal-drenos"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-drenos-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-drenos-topo">
          <span className="modal-drenos-icone" aria-hidden="true">
            <HiOutlineTrendingDown size={22} />
          </span>
          <div>
            <h2 id="modal-drenos-titulo">O que drena seu dinheiro</h2>
            <p>Quanto cada assinatura pesa no mês e o total já cobrado.</p>
          </div>
        </div>

        <div className="modal-drenos-resumo">
          <div className="modal-drenos-pill">
            <span>
              <FaChartBar size={14} aria-hidden="true" />
              Sai por mês
            </span>
            <strong>{formatarDinheiro(gastoMensal)}</strong>
          </div>
          <div className="modal-drenos-pill">
            <span>
              <FaWallet size={14} aria-hidden="true" />
              Já saiu
            </span>
            <strong>{formatarDinheiro(totalHistorico)}</strong>
          </div>
        </div>

        <ol className="modal-drenos-lista">
          {ordenadas.map((conta) => {
            const mensal = custoMensal(conta);
            const hist = historicoGasto(conta);
            const percentual = formatarPercentual(mensal, gastoMensal);
            const largura = gastoMensal > 0 ? Math.max((mensal / gastoMensal) * 100, 3) : 0;

            return (
              <li key={conta.id}>
                <div className="modal-drenos-item-topo">
                  <strong>{nomeParaExibicao(conta.nome)}</strong>
                  <em>{formatarDinheiro(mensal)}/mês</em>
                </div>
                <div className="modal-drenos-meta">
                  <span>
                    <FaChartBar size={12} aria-hidden="true" />
                    {percentual} do mês
                  </span>
                  <span>
                    <FaCalendarAlt size={12} aria-hidden="true" />
                    desde {formatarMesAno(hist.desde)}
                    {hist.ocorrencias != null
                      ? ` · ${hist.ocorrencias}x`
                      : ''}
                    {hist.estimado ? ' · estimado' : ''}
                  </span>
                  <span>
                    <FaWallet size={12} aria-hidden="true" />
                    {formatarDinheiro(hist.total)} já cobrado
                  </span>
                </div>
                <div className="modal-drenos-barra" aria-hidden="true">
                  <i style={{ width: `${largura}%` }} />
                </div>
              </li>
            );
          })}
        </ol>

        <div className="modal-botoes">
          <button ref={fecharRef} type="button" className="btn-cancelar" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
