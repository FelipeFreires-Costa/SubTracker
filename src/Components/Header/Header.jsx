import React from 'react'

const Header = ({valorTotal}) => {
  return (
    <div>
      <h2>Gasto Mensal: R$ {valorTotal.toFixed(2)}</h2>
    </div>
  )
}

export default Header