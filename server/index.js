/* eslint-env node */
const express = require('express');
const cors = require('cors');
const openDb = require('./db');

const app = express()
app.use(cors());
app.use(express.json());

//verifica/cria a tabela quando o servidor liga

async function inicializarBanco() {
  const db = await openDb();
  await db.exec(`
        CREATE TABLE IF NOT EXISTS contas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            preco REAL,
            data TEXT,
            pago INTEGER,
            categoria TEXT
        )
    `);
  console.log("Banco de dados configurado!");
}

inicializarBanco();

app.get('/api/contas', async (req, res) => {
    const db = await openDb();
    const contas = await db.all('SELECT * FROM contas');

    const contasFormatadas = contas.map((conta) => ({
        ...conta,
        pago: conta.pago === 1 // se for 1 vira true, se for 0 vira false
    }));

    res.json(contasFormatadas);
});

//rota POST, cria uma conta no banco de dados
app.post('/api/contas', async (req, res) => {
  const { nome, preco, data, categoria } = req.body
  const db = await openDb()

  const result = await db.run(
    'INSERT INTO contas (nome, preco, data, pago, categoria) VALUES (?, ?, ?, ?, ?)',
    [nome, preco, data, 0, categoria]
  )

  //devolve a conta criada com o ID do banco
  res.status(201).json({
    id: result.lastID,
    nome,
    preco,
    data,
    pago: false
  })
})


//rota DELETE
app.delete('/api/contas/:id', async (req, res) => {
  const id = req.params.id
  const db = await openDb()

  await db.run('DELETE FROM contas WHERE id = ?', [id])
  res.status(204).send()
})

//rota PATCH: atualiza o status (pago/ nao pago)
app.patch('/api/contas/:id', async (req, res) => {
  const id = req.params.id
  const { pago } = req.body // vem true ou false do react
  const db = await openDb()

  await db.run(
        'UPDATE contas SET pago = ? WHERE id = ?',
    [pago ? 1 : 0, id]
  )
  const contasAtualizada = await db.get('SELECT * FROM contas WHERE id = ?', [id])

  if(contasAtualizada){
    res.json({
      ...contasAtualizada,
      pago: contasAtualizada.pago === 1
    })
  }else{
    res.status(404).json({erros: "Contas não encontrada"})
  }
})

app.listen(3001, () => {
    console.log("🔥 Servidor rodando na porta 3001");
});

//rota PUT: editar os dados de uma conta
app.put('/api/contas/:id', async (req, res) => {
  const id = req.params.id;
  const { nome, preco, data, categoria } = req.body
  const db = await openDb()

  //atualiza os campos no Sqlite onde o ID for igual ao da rota
  await db.run(
    'UPDATE contas SET nome = ?, preco = ?, data = ?, categoria = ? WHERE id = ?',
    [nome, preco, data, categoria, id]
  )

  //devolve a conta atualizada para o front
  const contasAtualizada = await db.get('SELECT * FROM contas WHERE id = ?', [id])

  res.json({
    ...contasAtualizada,
    pago: contasAtualizada.pago === 1
  })
})
