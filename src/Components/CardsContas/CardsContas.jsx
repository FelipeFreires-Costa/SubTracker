import React from 'react'
import './CardsContas.css'
import calendario from '../../assets/calendar-lines-svgrepo-com.svg'
import lixo from '../../assets/trash-xmark-svgrepo-com.svg'

const CardsContas = ({nome, preco, data, aoRemover, situacao, foiPago, pago}) => {
  return (
      <div className={`card ${pago ? "pago" : situacao}`}>
        <div className='infos'>
          <h3>{nome}</h3>
          <p>R$ {preco.toFixed(2)}</p>
          <p><img className='calendario' src={calendario} alt="" /> {data}</p>
          <div className={`detalhes ${situacao}`}>
          <p>{situacao.toUpperCase()}</p>
          </div>
          <input type="checkbox" onChange={foiPago} checked={pago} />
          <p>{pago == false ? 'pagar!' : "pago!"}</p>             
          <button className='remover' onClick={aoRemover}>
            <img className='remover-img' src={lixo} alt="" />
          </button>
        </div>
      </div>      
  )
}

export default CardsContas