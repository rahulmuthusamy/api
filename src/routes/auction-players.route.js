const express = require('express');
const router = express.Router();

const auctionPlayers = require('../controllers/auction-players.controller');

const { createPlayerValidator } = require('../validations/players-master.validator');
const validateRequest = require('../middlewares/validateRequest');

router.post('/', createPlayerValidator, validateRequest, auctionPlayers.createAuctionPlayer
);

module.exports = router;
