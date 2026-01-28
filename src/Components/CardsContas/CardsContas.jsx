import React from 'react'

const CardsContas = ({nome, preco, data, aoRemover}) => {
  return (
    <div>
      <h3>{nome}</h3>
      <p>R$: {preco}</p>
      <p>Vencimento: {data}</p>
      <button onClick={aoRemover}>Remover</button>
    </div>
  )
}

export default CardsContas