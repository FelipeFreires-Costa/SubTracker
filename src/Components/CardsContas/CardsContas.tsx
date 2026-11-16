import { useEffect, useRef, useState, type RefObject } from 'react';
import './CardsContas.css';
import {
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaRegTrashAlt,
  FaTag,
  FaTv,
  FaWallet,
} from 'react-icons/fa';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { MdEdit, MdOutlineEventBusy, MdOutlineSchedule, MdToday } from 'react-icons/md';
import { nomeParaExibicao } from '../../utils/contaHelpers';

interface CardsContasProps {
  nome: string;
  preco: number;
  data: string;
  aoRemover: () => void;
  situacao: string;
  foiPago: () => void;
  pago: boolean;
  textoDias: string;
  aoEditar: () => void;
  categoria?: string;
  periodicidade?: string | null;
  historico?: string | null;
}

function rotuloSituacao(situacao: string, pago: boolean) {
  if (pago) return 'Paga';
  if (situacao === 'vencida') return 'Atrasada';
  if (situacao === 'perto') return 'Em breve';
  if (situacao === 'hoje') return 'Hoje';
  if (situacao === 'tranquilo') return 'Em dia';
  return situacao || 'Aberta';
}

function iconeSituacao(situacao: string, pago: boolean) {
  if (pago) return <FaCheck size={14} />;
  if (situacao === 'vencida') return <MdOutlineEventBusy size={16} />;
  if (situacao === 'hoje') return <MdToday size={16} />;
  return <MdOutlineSchedule size={16} />;
}

function iconeCategoria(categoria?: string) {
  const chave = (categoria || '').toLowerCase();
  if (chave.includes('stream')) return <FaTv size={12} />;
  if (chave.includes('moradia') || chave.includes('casa')) return <FaHome size={12} />;
  return <FaTag size={12} />;
}

function MenuAcoes({
  menuRef,
  menuAberto,
  setMenuAberto,
  estaAberto,
  aoEditar,
  aoExpandir,
  aoRemover,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  menuAberto: boolean;
  setMenuAberto: (aberto: boolean) => void;
  estaAberto: boolean;
  aoEditar: () => void;
  aoExpandir: () => void;
  aoRemover: () => void;
}) {
  return (
    <div className="acoes-menu" ref={menuRef}>
      <button
        className="btn-tres-pontos"
        type="button"
        aria-label="Mais ações"
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        onClick={() => setMenuAberto(!menuAberto)}
      >
        <HiOutlineDotsHorizontal size={20} />
      </button>

      {menuAberto && (
        <div className="dropdown-menu" role="menu">
          <button
            type="button"
            onClick={() => {
              aoEditar();
              setMenuAberto(false);
            }}
          >
            <MdEdit size={14} /> Editar
          </button>
          <button
            type="button"
            onClick={() => {
              aoExpandir();
              setMenuAberto(false);
            }}
          >
            {estaAberto ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />} Detalhes
          </button>
          <button
            type="button"
            onClick={() => {
              aoRemover();
              setMenuAberto(false);
            }}
            className="btn-excluir-drop"
          >
            <FaRegTrashAlt size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

const CardsContas = ({
  nome,
  preco,
  data,
  aoRemover,
  situacao,
  foiPago,
  pago,
  textoDias,
  aoEditar,
  categoria,
  periodicidade,
  historico,
}: CardsContasProps) => {
  const [estaAberto, setEstaAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = rotuloSituacao(situacao, pago);
  const valor = preco.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const titulo = nomeParaExibicao(nome);
  const classeStatus = pago ? 'pago' : situacao || 'aberta';
  const textoQuando = pago
    ? `Próxima ${data}`
    : situacao === 'vencida'
      ? `Venceu ${data}`
      : situacao === 'hoje'
        ? `Vence hoje`
        : `Vence ${data}`;

  useEffect(() => {
    function lidarComClique(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    if (menuAberto) {
      document.addEventListener('mousedown', lidarComClique);
    }

    return () => {
      document.removeEventListener('mousedown', lidarComClique);
    };
  }, [menuAberto]);

  return (
    <article className={`linha-conta ${classeStatus}`}>
      <div className="linha-conta-corpo">
        <span className={`linha-icone ${classeStatus}`} aria-hidden="true">
          {iconeSituacao(situacao, pago)}
        </span>

        <div className="linha-info">
          <div className="linha-topo">
            <h3 title={titulo}>{titulo}</h3>
            <span className={`status-pill ${classeStatus}`}>{status}</span>
          </div>

          <div className="linha-meta">
            {categoria && (
              <span className="meta-chip">
                {iconeCategoria(categoria)}
                {categoria}
              </span>
            )}
            {periodicidade && <span className="meta-chip">{periodicidade}</span>}
            <span className="meta-chip meta-quando">{textoQuando}</span>
            {!pago && textoDias && <span className="meta-chip meta-urgencia">{textoDias}</span>}
          </div>
        </div>

        <div className="linha-valor-bloco">
          <p className={`linha-valor ${pago ? 'pago' : 'saida'}`}>
            {pago ? `R$ ${valor}` : `R$ -${valor}`}
          </p>
          <span className="linha-valor-rotulo">{pago ? 'pago' : 'a pagar'}</span>
        </div>

        <button
          className={`pagar ${pago ? 'pago' : ''}`}
          type="button"
          onClick={foiPago}
        >
          {pago ? (
            <>
              <FaCheck size={12} aria-hidden="true" /> Desfazer
            </>
          ) : (
            'Paguei'
          )}
        </button>

        <MenuAcoes
          menuRef={menuRef}
          menuAberto={menuAberto}
          setMenuAberto={setMenuAberto}
          estaAberto={estaAberto}
          aoEditar={aoEditar}
          aoExpandir={() => setEstaAberto((aberto) => !aberto)}
          aoRemover={aoRemover}
        />
      </div>

      <div className={`card-conteudo-extra ${estaAberto ? 'aberto' : ''}`}>
        <div className="info-extra-texto">
          <p>
            <strong>Situação: </strong>
            {pago ? <span>Paga</span> : <span>{textoDias}</span>}
          </p>
          <p>
            <strong>Categoria: </strong>
            {categoria || 'Sem categoria'}
          </p>
          {periodicidade && (
            <p>
              <strong>Ciclo: </strong>
              {periodicidade}
            </p>
          )}
          <p>
            <strong>Próxima cobrança: </strong>
            {data}
          </p>
          {historico && (
            <p className="info-historico">
              <FaWallet size={12} aria-hidden="true" />
              <span>
                <strong>Já saiu: </strong>
                {historico}
              </span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export default CardsContas;
