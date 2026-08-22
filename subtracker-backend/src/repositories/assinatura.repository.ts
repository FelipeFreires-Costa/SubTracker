import db from '../config/database';

const AssinaturaRepository = {
  async salvar(
    itemId: string,
    nome: string,
    preco: number,
    dataTransacao: string,
    categoria = 'Assinatura',
  ) {
    const text = `
      INSERT INTO assinaturas (item_id, nome, preco, data_transacao, categoria)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [itemId, nome, Math.abs(preco), dataTransacao, categoria];

    try {
      const res = await db.query(text, values);
      return res.rows[0];
    } catch (err) {
      console.error('[DB] Erro ao salvar assinatura:', err);
      throw err;
    }
  },

  async buscarPorItemId(itemId: string) {
    const text =
      'SELECT * FROM assinaturas WHERE item_id = $1 ORDER BY data_transacao DESC;';

    try {
      const res = await db.query(text, [itemId]);
      return res.rows;
    } catch (err) {
      console.error('[DB] Erro ao buscar assinaturas:', err);
      throw err;
    }
  },
};

export default AssinaturaRepository;
