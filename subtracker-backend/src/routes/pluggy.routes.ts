const express = require('express');
const { PluggyController } = require('../controllers/pluggy.controller');

const router = express.Router();

// Rota 1: http://localhost:3000/api/connect-token
router.get('/connect-token', PluggyController.getConnectToken);

// Rota 2: http://localhost:3000/api/transactions/{itemId}
router.get('/transactions/:itemId', PluggyController.getTransactions);

module.exports = router;