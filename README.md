# SubTracker

Aplicação web para controle de assinaturas e contas recorrentes. O usuário cadastra gastos, acompanha vencimentos e pode importar assinaturas a partir do extrato bancário (Pluggy / Open Finance).

Este repositório é o artefato de software do **TCC2**. O documento acadêmico deve seguir o modelo ABNT da biblioteca institucional; os rascunhos de trabalho estão em `docs/tcc2/`.

## O que o sistema faz

- CRUD de contas (nome, valor, vencimento, categoria, pago/não pago)
- Totais: mensal, já pago e em aberto
- Alertas de prazo: vencida, vence hoje, próxima (até 3 dias) ou em dia
- Relatório com gráficos por serviço e por categoria
- Importação via Pluggy: filtra candidatos, remove duplicatas do mesmo serviço e grava no PostgreSQL

## Como executar

### 1. PostgreSQL

Crie o banco `subtracker_db` e execute `subtracker-backend/database/schema.sql`.

### 2. Backend

```powershell
cd subtracker-backend
```

Copie `.env.example` para `.env` e preencha `PLUGGY_*` e `DB_*`.

```powershell
npm install
npm run dev
```

API: `http://localhost:3000/api/health`

### 3. Frontend

```powershell
cd ..
npm install
npm run dev
```

Interface: `http://localhost:5173`

## Arquitetura

```
React (Vite)  →  Express  →  PostgreSQL
                    ↓
                 Pluggy
```

## Limitações acadêmicas

A detecção automática é heurística (palavras-chave). O teste principal usou sandbox da Pluggy. O protótipo é single-user.
