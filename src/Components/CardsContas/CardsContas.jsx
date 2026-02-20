import React, { useState } from "react";
import "./CardsContas.css";

import calendario from "../../assets/calendar-lines-svgrepo-com.svg";
import check from "../../assets/check-svgrepo-com.svg";
import checkPago from "../../assets/check-circle-svgrepo-com.svg";

import { FaChevronDown, FaChevronUp, FaRegTrashAlt } from "react-icons/fa";
import { MdEdit } from "react-icons/md";

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
}) => {
  const [estaAberto, setEstaAberto] = useState(false);

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

        <div className="acoes-btn">
          <button
            className="editar-btn"
            onClick={aoEditar}
            title="Editar conta"
          >
            <MdEdit size={18} color="#0077ff" />
          </button>

<button className='expandir' onClick={alternar} title="Ver detalhes">
                        {estaAberto ? <FaChevronUp size={18} color="#3a3a3a"/> : <FaChevronDown size={18} color="#3a3a3a"/>}
                    </button>

          <button className="remover" onClick={aoRemover} title="Excluir conta">
            <FaRegTrashAlt size={18} color="red" />
          </button>
        </div>
      </div>

      <div className={`card-conteudo-extra ${estaAberto ? "aberto" : ""}`}>
                <div className="info-extra-texto">
                    <p>
                        <strong>Status do prazo: </strong>
                        {pago ? (<span>Pago!</span>) : (<span>{textoDias}</span>)}
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
