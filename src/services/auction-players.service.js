const { AuctionPlayer } = require('../models');
const playerService = require('../services/players-master.service')
const response = require('../utils/response');
const { PLAYERS } = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');

const createAuctionPlayers = async (data) => {

    const players = await playerService.createPlayers(data);

    const { SessionID, BasePrice, } = data;

    const payload = {
        SessionID,
        PlayerID: players.PlayerID,
        BasePrice
    }

    return await AuctionPlayer.create(payload);
};

module.exports = { createAuctionPlayers }