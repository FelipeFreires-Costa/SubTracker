import { useEffect, useRef, useState, type RefObject } from 'react';
import './CardsContas.css';
import { FaArrowUp, FaCheck, FaChevronDown, FaChevronUp, FaRegTrashAlt } from 'react-icons/fa';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { MdEdit } from 'react-icons/md';
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
}

function rotuloSituacao(situacao: string) {
  if (situacao === 'vencida') return 'Atrasada';
  if (situacao === 'perto') return 'Vence em breve';
  if (situacao === 'hoje') return 'Hoje';
  if (situacao === 'tranquilo') return 'Em dia';
  return situacao;
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
        onClick={() => setMenuAberto(!menuAberto)}
      >
        <HiOutlineDotsHorizontal size={20} />
      </button>

      {menuAberto && (
        <div className="dropdown-menu">
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
            {estaAberto ? (
              <FaChevronUp size={14} />
            ) : (
              <FaChevronDown size={14} />
            )}{' '}
            Detalhes
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
}: CardsContasProps) => {
  const [estaAberto, setEstaAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const textoSituacao = rotuloSituacao(situacao);
  const valor = preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const textoData = pago
    ? `Próxima ${data}`
    : situacao === 'vencida'
      ? `Venceu ${data}`
      : `Vence ${data}`;
  const apoio = [periodicidade || 'Recorrente', textoData, pago ? 'Paga' : textoSituacao]
    .filter(Boolean)
    .join(' · ');
  const titulo = nomeParaExibicao(nome);

  return (
    <article className={`linha-conta ${pago ? 'pago' : situacao}`}>
      <div className="linha-conta-corpo">
        <span className={`linha-icone ${pago ? 'entrada' : 'saida'}`} aria-hidden="true">
          {pago ? <FaCheck size={12} /> : <FaArrowUp size={12} />}
        </span>

        <div className="linha-info">
          <h3 title={titulo}>{titulo}</h3>
          <p>{apoio}</p>
        </div>

        <p className={`linha-valor ${pago ? 'pago' : 'saida'}`}>
          {pago ? `R$ ${valor}` : `R$ -${valor}`}
        </p>

        <button className="pagar" type="button" onClick={foiPago}>
          {pago ? 'Desfazer' : 'Paguei'}
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
        </div>
      </div>
    </article>
  );
};

export default CardsContas;
