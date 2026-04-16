import React, { useState, useEffect } from 'react';
// Puxa o teu componente bonitão que já tá pronto
import CardsContas from './CardsContas'; 

export default function SubTrackerDashboard() {
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const buscarDadosDaAPI = async () => {
    try {
      const resposta = await fetch('http://localhost:3000/api/transactions/843d06b6-0f97-471f-bb52-adff59d5ac0c');
      const dados = await resposta.json();
      
      setAssinaturas(dados.extratoFiltrado);
    } catch (erro) {
      console.error("Vixe, deu o prego na hora de buscar:", erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosDaAPI();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Painel de Inteligência - SubTracker</h2>
      <p>Suas assinaturas encontradas na conta bancária.</p>

      {carregando ? (
        <p>Aguarde, os robôs tão lendo o extrato...</p>
      ) : (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          
          {assinaturas.length === 0 ? (
            <p>Nenhuma assinatura encontrada nesta conta.</p>
          ) : (
            assinaturas.map((item) => (
              /* A MÁGICA ACONTECE AQUI: O Tradutor */
              <CardsContas 
                key={item.id}
                
                // O que vem da API vai pros teus Props:
                nome={item.description} 
                
                // A Pluggy manda valor negativo (gasto), o Math.abs deixa positivo pro visual
                preco={Math.abs(item.amount)} 
                
                // Transformando a data feia do sistema em formato brasileiro
                data={new Date(item.date).toLocaleDateString('pt-BR')} 
                
                // Como é automático, a gente deduz que é uma assinatura ativa
                categoria="Assinatura Detectada"
                situacao="pendente"
                pago={false}
                textoDias="Detectado no extrato"
                
                // Funções vazias só pra não quebrar os botões do teu card por enquanto
                aoRemover={() => alert(`Clicou pra remover: ${item.description}`)}
                aoEditar={() => alert(`Clicou pra editar: ${item.description}`)}
                foiPago={() => alert('Marcar como pago no banco de dados futuramente')}
              />
            ))
          )}

        </div>
      )}
    </div>
  );
}