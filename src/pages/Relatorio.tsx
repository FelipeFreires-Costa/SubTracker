import { ExpensesCharts } from '../Components/ExpensesChart/ExpensesCharts';

export function Relatorio() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Painel Financeiro</h1>
      <p>Visão geral das suas assinaturas e contas.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px', 
        marginTop: '20px' 
      }}>

        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <ExpensesCharts />
        </div>


        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h3>Resumo Mensal</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
            R$ 1.170,00
          </p>
          <p style={{ color: '#7f8c8d' }}>Total em Assinaturas</p>
        </div>
      </div>
    </div>
  );
}