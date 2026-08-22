import React from 'react'
import './ModalConfirmacao.css'

interface ModalProps{
  aberto: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}

export function ModalConfirmacao({ aberto, aoConfirmar, aoCancelar}: ModalProps){
  //se o modal nao tiver aberto, o react nao renderiza
  if(!aberto) return null

  return (
    <div className='modal-overlay'>
      <div className='modal-box'>
        <h2>Excluir Conta</h2>
        <p>Quer apagar esta conta? Depois não dá para recuperar.</p>
        <div className='modal-botoes'>
          <button className='btn-cancelar' onClick={aoCancelar}>
            Cancelar
          </button>
          
          <button className='btn-excluir' onClick={aoConfirmar}>
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  )
}