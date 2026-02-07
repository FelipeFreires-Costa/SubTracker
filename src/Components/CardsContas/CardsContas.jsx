import React, { useState } from 'react'
import './CardsContas.css'

import calendario from '../../assets/calendar-lines-svgrepo-com.svg'
import check from '../../assets/check-svgrepo-com.svg'
import checkPago from "../../assets/check-circle-svgrepo-com.svg"

import { TbTrashXFilled } from "react-icons/tb";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Adicionei para as setas

const CardsContas = ({ nome, preco, data, aoRemover, situacao, foiPago, pago, textoDias }) => {
    
    const [estaAberto, setEstaAberto] = useState(false)

    function alternar() {
        setEstaAberto(!estaAberto)
    }

    return (
        <div className={`card ${pago ? "pago" : situacao}`}>

            <div className='infos'>
                
                <h3 title={nome}>{nome}</h3>
                
                <p className='preco'>R$ {preco.toFixed(2)}</p>
                <p>
                    <img className='calendario' src={calendario} alt="" /> 
                    {data}
                </p>

                {/* Status / Badge */}
                <div className={`detalhes ${situacao}`}>
                    {pago ? (
                        <img src={checkPago} className='img-pago' alt="Pago" />
                    ) : (
                        <p>{situacao.toUpperCase()}</p>
                    )}
                </div>

                <button className='pagar' onClick={foiPago}>
                    <img src={check} alt="" />
                    {pago === false ? 'pagar' : "pago!"}
                </button>

                <div className="acoes-btn">
                    <button className='remover' onClick={aoRemover} title="Excluir conta">
                    <TbTrashXFilled size={26} color='red' />
                    </button>

                    <button className='expandir' onClick={alternar} title="Ver detalhes">
                        {estaAberto ? <FaChevronUp size={20} color="#0077ff"/> : <FaChevronDown size={20} color="#0077ff"/>}
                    </button>
                </div>
            </div>


            {estaAberto && (
                <div className={`card-conteudo-extra ${estaAberto ? "aberto" : ""}`}>
                    <div className="info-extra-texto">
                        <strong>Status do prazo: </strong>
                        {pago ? (<span>Pago!</span>) : (<span>{textoDias} </span>)}
                    </div>
                </div>
            )}
            
        </div>
    )
}

export default CardsContas