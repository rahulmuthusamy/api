const { PlayerMaster } = require('../models');
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
    return await service.delete(id);
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
