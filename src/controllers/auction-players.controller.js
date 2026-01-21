const playerService = require('../services/players-master.service');
const auctionPlayerService = require('../services/auction-players.service');

const response = require('../utils/response');
const { PLAYERS } = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');


exports.createAuctionPlayer = async (req, res) => {

    const { SessionID, Mobile } = req.body;

    if (!SessionID) {
        return response.error(res, PLAYERS.MISSINGID);
    }

    const existing = await playerService.findPlayer({ Mobile: Mobile });

    if (existing) {
        return response.success(res, PLAYERS.EXISTING_RECORD, { existing }, HTTP.CONFLICT)
    }

    const auctionPlayer = await auctionPlayerService.createAuctionPlayers(req.body);


    return response.success(res, PLAYERS.CREATED, { auctionPlayer }, HTTP.CREATED);
};