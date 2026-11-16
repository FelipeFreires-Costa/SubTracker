import { useEffect, useRef } from 'react'
import './ModalConfirmacao.css'

interface ModalProps{
  aberto: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}

export function ModalConfirmacao({ aberto, aoConfirmar, aoCancelar}: ModalProps){
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) return

    cancelarRef.current?.focus()

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        aoCancelar()
      }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, aoCancelar])

  if(!aberto) return null

  return (
    <div className='modal-overlay' onClick={aoCancelar}>
      <div
        className='modal-box'
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-confirmacao-titulo'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='modal-confirmacao-titulo'>Excluir Conta</h2>
        <p>Quer apagar esta conta? Depois não dá para recuperar.</p>
        <div className='modal-botoes'>
          <button ref={cancelarRef} className='btn-cancelar' type='button' onClick={aoCancelar}>
            Cancelar
          </button>
          
          <button className='btn-excluir' type='button' onClick={aoConfirmar}>
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
