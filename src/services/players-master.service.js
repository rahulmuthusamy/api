const { PlayerMaster, AuctionPlayer, TeamPlayer, MatchSquad, PlayerMatchStats, AuctionBid, AuctionLog } = require('../models');
const BaseService = require('./base.service');
const response = require('../utils/response');
const { PLAYERS } = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');

const service = new BaseService(PlayerMaster);

const getAllPlayers = async () => {
    return await service.getAll();
};

const getPlayerById = async (id) => {
    return await service.getById(id);
};

const createPlayers = async (data) => {
    return await service.create(data);
};

const updatePlayers = async (id, data) => {
    return await service.update(id, data);
};

const deletePlayerByID = async (id) => {
    const transaction = await PlayerMaster.sequelize.transaction();
    try {
        if (typeof AuctionPlayer !== 'undefined') await AuctionPlayer.destroy({ where: { PlayerID: id }, transaction });
        if (typeof AuctionBid !== 'undefined') await AuctionBid.destroy({ where: { PlayerID: id }, transaction });
        if (typeof AuctionLog !== 'undefined') await AuctionLog.destroy({ where: { PlayerID: id }, transaction });
        if (typeof TeamPlayer !== 'undefined') await TeamPlayer.destroy({ where: { PlayerID: id }, transaction });
        if (typeof MatchSquad !== 'undefined') await MatchSquad.destroy({ where: { PlayerID: id }, transaction });
        if (typeof PlayerMatchStats !== 'undefined') await PlayerMatchStats.destroy({ where: { PlayerID: id }, transaction });
        
        const deletedCount = await PlayerMaster.destroy({ where: { PlayerID: id }, transaction });
        await transaction.commit();
        return deletedCount;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const findPlayer = async (where) => {
    return await service.findOne({ where });
};

module.exports = {
    getAllPlayers,
    getPlayerById,
    createPlayers,
    updatePlayers,
    deletePlayerByID,
    findPlayer
};
