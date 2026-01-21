const { PlayerMaster } = require('../models');
const response = require('../utils/response');
const { PLAYERS } = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');
const getAllPlayers = async () => {

    return await PlayerMaster.findAll();

};

const getPlayerById = async (id) => {

    return await PlayerMaster.findByPk(id);
};

const createPlayers = async (data) => {  

    return await PlayerMaster.create(data);
};

const updatePlayers = async (id, data) => {

    const players = await PlayerMaster.findByPk(id);

    if (!players) return null;

    await players.update(data);

    return players;
};

const deletePlayerByID = async (id) => {

    return await PlayerMaster.destroy({ where: { id } });
};

const findPlayer = async (where) => {
    return await PlayerMaster.findOne({ where });
};
module.exports = {
    getAllPlayers,
    getPlayerById,
    createPlayers,
    updatePlayers,
    deletePlayerByID,
    findPlayer
};
