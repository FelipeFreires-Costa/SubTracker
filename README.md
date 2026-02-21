# 💰 SubTracker - Gerenciador de Assinaturas

> Controle seus gastos recorrentes, visualize vencimentos e evite surpresas no fim do mês.

## 📸 Preview do Projeto

<img width="1903" height="873" alt="image" src="https://github.com/user-attachments/assets/3a9943b3-0d6d-4a51-94c9-c1ebd5cd64af" />


## 💡 Sobre o Projeto

O **SubTracker** é uma aplicação Web desenvolvida para resolver uma dor comum: a desorganização financeira com assinaturas mensais (Netflix, Spotify, Academias, etc).

O objetivo foi criar uma solução onde o usuário pode cadastrar suas contas, visualizar quanto gasta no total e ser alertado visualmente sobre prazos de vencimento.

Este projeto foi fundamental para consolidar conhecimentos em **Lógica de Programação**, **Manipulação de Arrays** e **Persistência de Dados**.

## ⚙️ Funcionalidades e Regras de Negócio

- **CRUD Completo:** Criação, Listagem e Remoção de assinaturas.
- **Cálculo Automático:** O sistema soma o total de gastos mensais em tempo real (utilizando `.reduce`), ignorando contas já pagas.
- **Inteligência de Datas:**
  - 🔴 **Vencida:** Alerta visual se a data já passou.
  - 🟡 **Próxima:** Alerta se faltam 3 dias ou menos.
  - 🔵 **Em dia:** Status normal para datas futuras.
- **Toggle de Pagamento:** Botão interativo para marcar/desmarcar uma conta como "Paga", alterando o visual e o cálculo total.
- **Persistência Local:** Uso do `localStorage` para manter os dados salvos mesmo após recarregar a página.

## 🧠 Aprendizados Técnicos

Durante o desenvolvimento, enfrentei e resolvi desafios como:

- **Manipulação de Tempo:** Aprendi a comparar datas (`new Date`), zerar horas para evitar bugs de fuso horário e converter milissegundos em dias.
- **Estado Complexo:** Gerenciamento de lista de objetos com `useState`.
- **Imutabilidade:** Uso correto de `.map` e `.filter` para atualizar estados sem ferir a imutabilidade do React.
- **Renderização Condicional:** Classes de CSS dinâmicas baseadas em múltiplos estados (Pago vs Vencido).

irei fazer o deploy em breve
