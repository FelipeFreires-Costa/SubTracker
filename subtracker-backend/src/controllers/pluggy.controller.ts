const PluggyService = require('../services/pluggy.service');

const PluggyController = {
  // Recebe o pedido do Front-end e devolve o token
  async getConnectToken(req: any, res: any) {
    try {
      const token = await PluggyService.generateConnectToken();
      res.json({
        mensagem: "Token gerado com sucesso!",
        accessToken: token
      });
    } catch (error: any) {
      console.error("Erro ao gerar Connect Token: ", error.message);
      res.status(500).json({ erro: 'Falha ao gerar o token', detalhes: error.message });
    }
  },

  // Recebe o ID do item, chama o filtro e devolve as assinaturas
  async getTransactions(req: any, res: any) {
    try {
      const { itemId } = req.params;
      const result = await PluggyService.getFilteredTransactions(itemId);
      
      res.json({
        mensagem: "Assinaturas filtradas com sucesso!",
        ...result
      });
    } catch (error: any) {
      console.error("Erro ao buscar transações: ", error.message);
      res.status(500).json({ erro: 'Falha ao buscar transações na Pluggy', detalhes: error.message });
    }
  }
};

module.exports = { PluggyController };