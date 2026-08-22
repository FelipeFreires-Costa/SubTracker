import '../ModalConfirmacao/ModalConfirmacao.css';
import './ModalConta.css';

interface ModalContaProps {
  aberto: boolean;
  editando: boolean;
  nome: string;
  preco: string;
  data: string;
  categoria: string;
  onNome: (valor: string) => void;
  onPreco: (valor: string) => void;
  onData: (valor: string) => void;
  onCategoria: (valor: string) => void;
  onSalvar: () => void;
  onCancelar: () => void;
}

export function ModalConta({
  aberto,
  editando,
  nome,
  preco,
  data,
  categoria,
  onNome,
  onPreco,
  onData,
  onCategoria,
  onSalvar,
  onCancelar,
}: ModalContaProps) {
  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-box modal-conta" onClick={(e) => e.stopPropagation()}>
        <h2>{editando ? 'Editar conta' : 'Nova conta'}</h2>
        <p>{editando ? 'Mude o que precisar e salve.' : 'Preencha os dados da conta que você quer acompanhar.'}</p>

        <form
          className="modal-conta-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSalvar();
          }}
        >
          <label htmlFor="modal-nome">Nome da conta</label>
          <input
            id="modal-nome"
            type="text"
            placeholder="Ex: Conta de luz"
            value={nome}
            onChange={(e) => onNome(e.target.value)}
            autoFocus
          />

          <label htmlFor="modal-preco">Valor</label>
          <input
            id="modal-preco"
            type="number"
            placeholder="Ex: 75"
            value={preco}
            onChange={(e) => onPreco(e.target.value)}
          />

          <label htmlFor="modal-data">Vencimento</label>
          <input
            id="modal-data"
            type="date"
            value={data}
            onChange={(e) => onData(e.target.value)}
          />

          <label htmlFor="modal-categoria">Tipo</label>
          <select
            id="modal-categoria"
            value={categoria}
            onChange={(e) => onCategoria(e.target.value)}
          >
            <option value="">Selecione...</option>
            <option value="Streaming">Streaming</option>
            <option value="Moradia">Moradia</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Educação">Educação</option>
            <option value="Transporte">Transporte</option>
            <option value="Outros">Outros</option>
          </select>

          <div className="modal-botoes">
            <button type="button" className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar-conta">
              {editando ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
