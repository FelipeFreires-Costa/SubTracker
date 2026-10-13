import {
  avaliarSituacao,
  ehDespesa,
  ehTransferenciaPessoa,
  identificarRecorrencias,
  projetarProximaCobranca,
} from '../src/utils/heuristica.recorrencia';
import { formatarNomeServico } from '../src/utils/categoria.mapper';

function falhou(condicao: boolean, mensagem: string) {
  if (!condicao) {
    throw new Error(mensagem);
  }
}

const netflix = identificarRecorrencias([
  { description: 'NETFLIX', amount: -55.9, date: '2026-05-10', category: 'Subscriptions' },
  { description: 'Netflix', amount: -55.9, date: '2026-06-10', category: 'Subscriptions' },
  { description: 'NETFLIX', amount: -55.9, date: '2026-07-10', category: 'Subscriptions' },
]);

const ifood = identificarRecorrencias([
  { description: 'IFOOD', amount: -42, date: '2026-07-01', category: 'Food' },
  { description: 'IFOOD', amount: -89, date: '2026-07-18', category: 'Food' },
]);

const credito = identificarRecorrencias([
  { description: 'SPOTIFY', amount: 21.9, date: '2026-05-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
  { description: 'SPOTIFY', amount: 21.9, date: '2026-06-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
  { description: 'SPOTIFY', amount: 21.9, date: '2026-07-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
]);

falhou(netflix.length === 1 && netflix[0]?.classificacao === 'recorrente', 'Netflix deveria ser recorrente');
falhou(netflix[0]?.periodicidade === 'mensal', 'Netflix deveria ser mensal');
falhou(netflix[0]?.proximaCobranca === '2026-08-10', `Próxima cobrança Netflix incorreta: ${netflix[0]?.proximaCobranca}`);

const netflixVariacao = identificarRecorrencias([
  { description: 'NETFLIX.COM', amount: -55.9, date: '2026-05-10', category: 'Subscriptions' },
  { description: 'Netflix', amount: -55.9, date: '2026-06-10', category: 'Subscriptions' },
  { description: 'NETFLIX 8831', amount: -55.9, date: '2026-07-10', category: 'Subscriptions' },
]);
falhou(netflixVariacao.length === 1 && netflixVariacao[0]?.classificacao === 'recorrente', 'Variações de Netflix deveriam ser o mesmo grupo');
falhou(ifood[0]?.classificacao === 'eventual', 'Ifood com valores e intervalo irregulares deveria ser eventual');
falhou(credito[0]?.classificacao === 'recorrente', 'Spotify no cartão (valor positivo) deveria ser despesa recorrente');
falhou(ehDespesa(-10) === true && ehDespesa(10) === false, 'Conta corrente: só negativo é despesa');
falhou(ehDespesa(10, 'CREDIT') === true && ehDespesa(-10, 'CREDIT') === false, 'Cartão: só positivo é despesa');
falhou(projetarProximaCobranca('2026-01-31', 'mensal', 30) === '2026-02-28' || projetarProximaCobranca('2026-01-31', 'mensal', 30) === '2026-03-03', 'Projeção mensal deve avançar o mês');

const pixPessoa = identificarRecorrencias([
  { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-05-10', category: 'Transfer' },
  { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-06-10', category: 'Transfer' },
  { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-07-10', category: 'Transfer' },
]);
falhou(
  pixPessoa.filter((item) => item.classificacao === 'recorrente').length === 0,
  'PIX para pessoa não deveria virar conta recorrente',
);

const pixCondominio = identificarRecorrencias([
  { description: 'PIX CONDOMINIO EDIFICIO SOLAR', amount: -450, date: '2026-05-05', category: 'Utilities' },
  { description: 'PIX CONDOMINIO EDIFICIO SOLAR', amount: -450, date: '2026-06-05', category: 'Utilities' },
  { description: 'PIX CONDOMINIO EDIFICIO SOLAR', amount: -450, date: '2026-07-05', category: 'Utilities' },
]);
falhou(
  pixCondominio[0]?.classificacao === 'recorrente',
  'PIX de condomínio deveria ser conta recorrente',
);

const parcela = identificarRecorrencias([
  { description: 'AMAZON RETAIL CPI 1/3', amount: 28.3, date: '2026-02-27', category: 'Shopping', tipoConta: 'CREDIT' },
  { description: 'AMAZON RETAIL CPI 2/3', amount: 28.3, date: '2026-03-27', category: 'Shopping', tipoConta: 'CREDIT' },
  { description: 'AMAZON RETAIL CPI 3/3', amount: 28.3, date: '2026-04-27', category: 'Shopping', tipoConta: 'CREDIT' },
]);
falhou(
  parcela.filter((item) => item.classificacao === 'recorrente').length === 0,
  'Parcela de cartão não deveria virar conta recorrente',
);
falhou(parcela[0]?.parcelaAtual === 3 && parcela[0]?.parcelaTotal === 3, 'Parcela deveria guardar 3/3');
falhou(parcela[0]?.nome === 'AMAZON RETAIL CPI', 'Nome da parcela deveria vir sem o 3/3');
falhou(parcela[0]?.pago === true, 'Plano 3/3 deveria aparecer como pago');
const cicloAtual = avaliarSituacao('2026-09-10', 'mensal', '2026-09-17');
falhou(cicloAtual.situacao === 'ativa' && cicloAtual.pago, 'Cobrança deste ciclo deveria aparecer como ativa e paga');
falhou(cicloAtual.proximaCobranca === '2026-10-10', `Próximo ciclo deveria ser outubro: ${cicloAtual.proximaCobranca}`);

const pendente = avaliarSituacao('2026-08-10', 'mensal', '2026-08-15');
falhou(pendente.situacao === 'ativa', 'Antes da data esperada ainda é ativa');
const aguardando = avaliarSituacao('2026-07-10', 'mensal', '2026-08-15');
falhou(aguardando.situacao === 'pendente' && !aguardando.pago, 'Até 10 dias depois da data esperada é pendente');
falhou(aguardando.proximaCobranca === '2026-08-10', `Vencimento pendente incorreto: ${aguardando.proximaCobranca}`);

const cancelada = avaliarSituacao('2025-03-15', 'mensal', '2026-09-17');
falhou(cancelada.situacao === 'encerrada', 'Sem cobrança há mais de um ciclo + tolerância deveria ser encerrada');
falhou(cancelada.proximaCobranca < '2026-09-17', 'Encerrada não pode ganhar data no futuro');

const anual = avaliarSituacao('2025-10-01', 'anual', '2026-09-17');
falhou(anual.situacao === 'ativa' && anual.proximaCobranca === '2026-10-01', 'Anual cobrado há 11 meses ainda é ativa');

falhou(ehTransferenciaPessoa('PIX TRANSF IRENE LOPES', 'Transfer'), '"Irene" contém "enel" mas é pessoa');
falhou(ehTransferenciaPessoa('Transferência Enviada|53. . Alciene Lopes Araujo', 'Transfer'), 'Transferência com acento para pessoa');
falhou(!ehTransferenciaPessoa('PIX ENEL DISTRIBUICAO', 'Transfer'), 'PIX para a Enel é conta de luz');

const semCiclo = identificarRecorrencias([
  { description: 'DL ROBLOX', amount: -25, date: '2026-07-16', category: 'Games' },
  { description: 'DL ROBLOX', amount: -25, date: '2026-07-30', category: 'Games' },
  { description: 'DL ROBLOX', amount: -25, date: '2026-09-08', category: 'Games' },
]);
falhou(semCiclo[0]?.classificacao === 'eventual', 'Mesmo valor sem ciclo regular não é recorrente');

const fimMes = identificarRecorrencias([
  { description: 'CLARO TV', amount: -89.9, date: '2026-01-31', category: 'Utilities' },
  { description: 'CLARO TV', amount: -89.9, date: '2026-02-28', category: 'Utilities' },
  { description: 'CLARO TV', amount: -89.9, date: '2026-03-31', category: 'Utilities' },
]);
falhou(fimMes[0]?.classificacao === 'recorrente', 'Cobrança no último dia do mês deveria ser recorrente');
falhou(fimMes[0]?.periodicidade === 'mensal', 'Cobrança no último dia do mês deveria ser mensal');

const netflixPromo = identificarRecorrencias([
  { description: 'NETFLIX', amount: -55.9, date: '2026-05-10', category: 'Subscriptions' },
  { description: 'NETFLIX', amount: -27.95, date: '2026-06-10', category: 'Subscriptions' },
  { description: 'NETFLIX', amount: -55.9, date: '2026-07-10', category: 'Subscriptions' },
]);
falhou(netflixPromo[0]?.classificacao === 'recorrente', 'Um mês promocional não deveria derrubar a assinatura');

const pulouMes = identificarRecorrencias([
  { description: 'SPOTIFY', amount: -21.9, date: '2026-04-05', category: 'Subscriptions' },
  { description: 'SPOTIFY', amount: -21.9, date: '2026-05-05', category: 'Subscriptions' },
  { description: 'SPOTIFY', amount: -21.9, date: '2026-07-05', category: 'Subscriptions' },
]);
falhou(pulouMes[0]?.classificacao === 'recorrente', 'Um mês pulado não deveria derrubar a assinatura');
falhou(pulouMes[0]?.periodicidade === 'mensal', 'Um mês pulado ainda deveria ser mensal');

const amazonPrime = identificarRecorrencias([
  {
    description: 'AMAZONPRIMEBR*8831',
    merchantName: 'Amazon Prime',
    amount: -14.9,
    date: '2026-05-10',
    category: 'Subscriptions',
  },
  {
    description: 'AMAZONPRIMEBR*8831',
    merchantName: 'Amazon Prime',
    amount: -14.9,
    date: '2026-06-10',
    category: 'Subscriptions',
  },
  {
    description: 'AMAZONPRIMEBR*8831',
    merchantName: 'Amazon Prime',
    amount: -14.9,
    date: '2026-07-10',
    category: 'Subscriptions',
  },
]);
falhou(amazonPrime[0]?.classificacao === 'recorrente', 'Amazon Prime deveria ser recorrente');
falhou(amazonPrime[0]?.chave === 'amazonprimebr', 'A chave do grupo deve vir do extrato, não do nome bonito');
falhou(amazonPrime[0]?.nome === 'Amazon Prime', 'O nome exibido deve preferir o estabelecimento');
falhou(formatarNomeServico('AMAZONPRIMEBR*8831') === 'Amazon Prime', 'Descrição de extrato deve virar nome de serviço');

console.log('Heurística de recorrência ok.');
