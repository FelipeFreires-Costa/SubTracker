import React, { useState, useEffect, useRef } from "react";
import "./CardsContas.css";

// @ts-ignore
import calendario from "../../assets/calendar-lines-svgrepo-com.svg";
// @ts-ignore
import check from "../../assets/check-svgrepo-com.svg";
// @ts-ignore
import checkPago from "../../assets/check-circle-svgrepo-com.svg";

import {
  FaChevronDown,
  FaChevronUp,
  FaRegTrashAlt
} from "react-icons/fa";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { MdEdit } from "react-icons/md";

// regra do componente
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
}: CardsContasProps) => {
  const [estaAberto, setEstaAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    //funçao para verificar onde o usuario toca
    function lidarComClique(event: MouseEvent){
      //se a antena existe E o clique nao acontecer dentro dela
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false); // ...fecha o menu!
      }
    }
    //so liga seo  menu estiver aberto
    if(menuAberto){
      document.addEventListener('mousedown', lidarComClique)
    }else{
      document.removeEventListener("mousedown", lidarComClique);
    }

    return() => {
      document.removeEventListener("mousedown", lidarComClique);
    }
  }, [menuAberto])

  function alternar() {
    setEstaAberto(!estaAberto);
  }

  return (
    <div className={`card ${pago ? "pago" : situacao}`}>
      <div className="infos">
        <h3 title={nome}>{nome}</h3>

        <p className="preco">R$ {preco.toFixed(2)}</p>
        <p className="vencimento">
          <img className="calendario" src={calendario} alt="" />
          {data}
        </p>

        <div className={`detalhes ${situacao}`}>
          {pago ? (
            <img src={checkPago} className="img-pago" alt="Pago" />
          ) : (
            <p>{situacao.toUpperCase()}</p>
          )}
        </div>

        <button className="pagar" onClick={foiPago}>
          <img src={check} alt="" />
          {pago === false ? "pagar" : "pago!"}
        </button>

        <div className="acoes-menu" ref={menuRef}>
          <button className="btn-tres-pontos" onClick={() => setMenuAberto(!menuAberto)}>
            <HiOutlineDotsHorizontal size={18} color="#3a3a3a" />
          </button>

          {/* menu flutuante */}
          {menuAberto && (
            <div className="dropdown-menu">
              <button onClick={() => { aoEditar(); setMenuAberto(false); }}>
                <MdEdit size={14} color="#555"/> Editar
              </button>
              <button onClick={() => { alternar(); setMenuAberto(false); }}>
                {estaAberto ? <FaChevronUp size={14} color="#555"/> : <FaChevronDown size={14} color="#555"/>} Expandir
              </button>
              <button onClick={() => { aoRemover(); setMenuAberto(false); }} className="btn-excluir-drop">
                <FaRegTrashAlt size={14} color="red"/> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`card-conteudo-extra ${estaAberto ? "aberto" : ""}`}>
        <div className="info-extra-texto">
          <p>
            <strong>Status do prazo: </strong>
            {pago ? <span>Pago!</span> : <span>{textoDias}</span>}
          </p>
          <p>
            <strong>Categoria: </strong>
            {categoria ? categoria : "Sem categoria"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardsContas;