# SubTracker

Aplicação web para identificar, organizar e acompanhar despesas recorrentes a partir de cadastro manual ou do Open Finance (Pluggy). Este repositório é o **artefato de software do TCC 2**.

Stack: **React (Vite)** · **Express** · **PostgreSQL** · **Pluggy (Sandbox / Open Finance)**.

## Telas

| Rota | Função |
|------|--------|
| **Contas** (`/`) | Visão geral: KPIs, gráfico de gasto no tempo, próximos vencimentos e lista de contas por mês |
| **Relatório** (`/relatorio`) | Respostas rápidas (hoje, mensal, 7 dias, maior dreno), agenda da semana, pizza por categoria e ranking |
| **Fatura** (`/fatura`) | Fatura do cartão com abas de período (atual / próxima / recentes) e filtro de assinaturas |
| **Modo TCC** (`/demonstracao-academica`) | Demonstração acadêmica isolada: algoritmo real em memória + métricas oficiais do held-out |

## O que o sistema faz

- CRUD de contas/assinaturas (nome, valor, vencimento, categoria, ciclo, pago/não pago)
- Ícones por categoria (sem emoji) e rótulos em português
- Totais mensal/anual, histórico já cobrado e alertas (atrasada, hoje, próximos dias)
- Heurística de recorrência na importação Pluggy (só o que for recorrente é persistido)
- Fatura do cartão com navegação entre meses e cruzamento com assinaturas monitoradas
- **Demonstração Acadêmica** (Modo TCC): dados fictícios em memória, execução de `identificarRecorrencias`, métricas documentadas — **não grava no banco e não chama a Pluggy**

## Privacidade (LGPD)

Extrato bruto e saldo da instituição **não são persistidos**. A conexão guarda identificador técnico (`item_id`) e contagens da última análise.

## Como executar

### 1. PostgreSQL

Crie o banco `subtracker_db` e, na pasta `subtracker-backend`:

```powershell
node scripts/migrate-recorrencia.js
```

Instalação nova também pode usar `database/schema.sql`.

### 2. Backend

```powershell
cd subtracker-backend
copy .env.example .env
npm install
npm run dev
```

Preencha `PLUGGY_*` e `DB_*` no `.env`.  
API: `http://localhost:3000/api/health`

### 3. Frontend

```powershell
cd ..
npm install
npm run dev
```

Interface: `http://localhost:5173`

## Avaliação acadêmica (evidência formal)

No backend:

```powershell
npm run avaliar:teste:oficial    # held-out semente 2027, N=120
npm run avaliar:estabilidade     # 15 sementes × 120
npm run avaliar                  # regressão N=21 (não é evidência independente)
```

Ou via API (ambiente local):

- `GET /api/heuristica/avaliacao` → oficial 2027  
- `GET /api/heuristica/avaliacao?conjunto=dev` → N=21  

Arquivos versionados:

- `subtracker-backend/avaliacao/resultado-teste-oficial-2027.json`
- `subtracker-backend/avaliacao/resumo-oficial-2027.json`
- `subtracker-backend/avaliacao/analise-estabilidade-sementes.json`
- `subtracker-backend/avaliacao/resultado-desenvolvimento-N21.json`
- `subtracker-backend/avaliacao/apendice-reproducao/` (regras congeladas e guia de reprodução)

**Resultado oficial (semente 2027):** heurística Acc/Prec/Rec/F1 = **100%** (VP 60, VN 60, FP 0, FN 0); linha de base Acc **58,3%**. Estabilidade: média **99,83%** em 15 sementes.  
N=21 e semente 2026 são desenvolvimento/exploração — **não** evidência independente.

### Demonstração Acadêmica na interface

1. Menu **Modo TCC**
2. Aba **Demonstração do algoritmo** → Carregar dados → Executar identificação  
3. Aba **Resultados experimentais** → métricas oficiais e matriz de confusão  
4. **Encerrar demonstração** limpa só o estado da página (contas reais intactas)

Endpoints: `GET/POST /api/demo-academica/dataset|executar|metricas`

## Como demonstrar (banca)

1. **Contas:** cadastrar, marcar pago, editar; conectar Pluggy ou usar **Gerador local (não é Pluggy)**  
2. **Relatório:** perguntas do dia, agenda de 7 dias, composição e ranking  
3. **Fatura:** abas Atual / Próxima e lançamentos do cartão  
4. **Modo TCC:** algoritmo + métricas oficiais sem misturar com dados do usuário  
5. **Scripts:** `avaliar:teste:oficial` e `avaliar:estabilidade` no backend  

Sandbox Pluggy (`VITE_PLUGGY_SANDBOX=true`, padrão): widget com Pluggy Bank (`user-ok` / `password-ok`). O gerador local é distinto do widget Sandbox. `npm run sandbox` no backend compara esperado × obtido.

## Arquitetura

```
React (Vite)  →  Express  →  PostgreSQL
                    ↓
              Pluggy (análise em memória)
                    ↓
         /demo-academica (só memória)
```

## Limitações

A detecção é heurística. PIX/TED pessoa a pessoa não entram como recorrentes; PIX com indicação de conta (condomínio, aluguel, operadora) pode entrar. Parcelamento de cartão e pagamento de fatura/boleto não viram assinatura. Sincronização sob demanda (não 24h). Artefato single-user do TCC 2. Métricas oficiais referem-se a gabarito sintético controlado — **não** a acurácia universal em extratos Open Finance reais.
