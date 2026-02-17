const express = require('express');
const cors = require('cors');

const app = express()
app.use(cors())
app.use(express.json())

const contas = [
  { id: 1, nome: "Netflix (Do Backend)", preco: 55.90, data: "2026-02-15", pago: true },
  { id: 2, nome: "Spotify (Do Backend)", preco: 21.90, data: "2026-02-20", pago: false },
];


app.get('/api/contas', (req, res) => {
  res.json(contas);
});


app.listen(3001, () => {
  console.log('🔥 Servidor rodando na porta 3001');
});