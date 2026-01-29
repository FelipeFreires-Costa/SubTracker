import React from 'react'
import './CardsContas.css'

const CardsContas = ({nome, preco, data, aoRemover, situacao, foiPago, pago}) => {
  return (
    <div>

      <div>
        <p>Status: </p>
      </div>

      <div className={`card ${pago ? "pago" : situacao}`}>
          <h3>{nome}</h3>
          <p>R$: {preco.toFixed(2)}</p>
          <p>Vencimento: {data}</p>
          <button onClick={aoRemover}>Remover</button>
          <p>Status: {situacao}</p>
          <input type="checkbox" onChange={foiPago} checked={pago}/>
          <p>{pago == false ? 'falta pagar!' : "pago!"}</p>          
      </div>

    </div>
  )
}

export default CardsContas