// O '../' faz ele sair da pasta 'repositories' e entrar na 'config'
import db = require('../config/database'); 

const AssinaturaRepository = {
  
  // 1. Função para INSERIR dados no banco
  async salvar(itemId: string, nome: string, preco: number, dataTransacao: string, categoria: string = 'Assinatura') {
    // A query parametrizada ($1, $2...) IMPEDE ataques de SQL Injection
    const text = `
      INSERT INTO assinaturas (item_id, nome, preco, data_transacao, categoria)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    // Math.abs garante que o valor seja salvo sempre positivo
    const values = [itemId, nome, Math.abs(preco), dataTransacao, categoria];

    try {
      const res = await db.query(text, values);
      return res.rows[0];
    } catch (err) {
      console.error('Erro ao salvar assinatura no banco:', err);
      throw err;
    }
  },

  // 2. Função para BUSCAR os dados e evitar chamar a Pluggy toda vez
  async buscarPorItemId(itemId: string) {
    const text = 'SELECT * FROM assinaturas WHERE item_id = $1 ORDER BY data_transacao DESC;';
    
    try {
      const res = await db.query(text, [itemId]);
      return res.rows;
    } catch (err) {
      console.error('Erro ao buscar assinaturas no banco:', err);
      throw err;
    }
  }
};

// Exportação no padrão CommonJS exigido pelo seu TSConfig
export = AssinaturaRepository;