const PluggyService = require('../services/pluggy.service');
// 1. Importa o repositório (ajuste o caminho se a sua pasta for diferente)
const AssinaturaRepository = require('../repositories/assinatura.repository'); 

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

  // Recebe o ID do item, checa o banco, chama a Pluggy se necessário e salva
  async getTransactions(req: any, res: any) {
    try {
      const { itemId } = req.params;

      // ==========================================
      // PASSO 1: Verifica o Banco de Dados Local
      // ==========================================
      const assinaturasSalvas = await AssinaturaRepository.buscarPorItemId(itemId);

      // Se achou no banco, devolve direto e encerra a função
      if (assinaturasSalvas && assinaturasSalvas.length > 0) {
        console.log("📦 Dados encontrados no banco local! Retornando...");
        return res.json({
          mensagem: "Assinaturas carregadas do banco local com sucesso!",
          assinaturas: assinaturasSalvas
        });
      }

      // ==========================================
      // PASSO 2: Se o banco estiver vazio, busca na Pluggy
      // ==========================================
      console.log("☁️ Banco vazio. Buscando dados na Pluggy...");
      const result = await PluggyService.getFilteredTransactions(itemId);
      
      // Dependendo de como seu Service retorna, os dados podem estar direto no result ou em result.assinaturas
      const assinaturasDaPluggy = result.assinaturas || result; 

      // ==========================================
      // PASSO 3: Salva os dados novos no nosso Banco
      // ==========================================
      for (const ass of assinaturasDaPluggy) {
        // ATENÇÃO: Ajuste as chaves (description, amount, date) conforme 
        // o formato exato que a Pluggy devolve no seu 'getFilteredTransactions'
        await AssinaturaRepository.salvar(
          itemId,
          ass.description || ass.nome, // Nome do serviço (Netflix, Spotify)
          ass.amount || ass.preco,     // Valor
          ass.date || ass.data,        // Data da transação
          ass.category || 'Assinatura'
        );
      }

      // ==========================================
      // PASSO 4: Retorna os dados recém-salvos (com os UUIDs gerados pelo banco)
      // ==========================================
      const assinaturasAtualizadas = await AssinaturaRepository.buscarPorItemId(itemId);

      res.json({
        mensagem: "Assinaturas baixadas da Pluggy e sincronizadas no banco com sucesso!",
        assinaturas: assinaturasAtualizadas
      });

    } catch (error: any) {
      console.error("Erro ao processar transações: ", error.message);
      res.status(500).json({ erro: 'Falha ao processar transações', detalhes: error.message });
    }
  }
};

module.exports = { PluggyController };