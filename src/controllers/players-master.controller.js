const playersService = require('../services/players-master.service');
const response = require('../utils/response');
const { PLAYERS } = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');

exports.getAllPlayers = async (req, res) => {

    const players = await playersService.getAllPlayers();

    if (!players.length) {
        return response.success(res, PLAYERS.NOT_FOUND, { players }, HTTP.NOT_FOUND);
    }

    return response.success(res, PLAYERS.FETCH_SUCCESS, { players });
};

exports.getPlayerById = async (req, res) => {

    const { id } = req.params;

    const players = await playersService.getPlayerById(id);

    if (!players) {
        return response.success(res, PLAYERS.NOT_FOUND, {}, HTTP.NOT_FOUND);
    }

    return response.success(res, PLAYERS.FETCH_SUCCESS, { players });

};

exports.createPlayer = async (req, res) => {

    const { Mobile } = req.body;

    const payload = req.body;

    const imagePath = req.file
        ? `/uploads/players/${req.file.filename}`
        : null;

    payload.PhotoURL = imagePath;
    payload.AadharURL = req.files?.AadharCard?.[0]?.path ? `/uploads/players/${req.files.AadharCard[0].filename}` : null;

    const existing = await playersService.findPlayer({ Mobile: Mobile });

    if (existing) {
        return response.success(res, PLAYERS.EXISTING_RECORD, { existing }, HTTP.CONFLICT)
    }
    const players = await playersService.createPlayers(payload);

    return response.success(res, PLAYERS.CREATED, { players }, HTTP.CREATED);
};

exports.updatePlayer = async (req, res) => {

    const { id } = req.params;

    const imagePath = req.file
        ? `/uploads/players/${req.file.filename}`
        : null;

    const payload = req.body;

    if (imagePath) {
        payload.PhotoURL = imagePath;
    }

    const updated = await playersService.updatePlayers(id, payload);

    if (!updated) {
        return response.success(res, PLAYERS.NOT_FOUND, {}, HTTP.NOT_FOUND);
    }

    return response.success(res, PLAYERS.UPDATED, { players: updated });
};

exports.deletePlayer = async (req, res) => {

    const { id } = req.params;

    if (!id) {
        return response.error(res, { message: PLAYERS.MISSINGID })
    }
    const deleted = await playersService.deletePlayerByID(id);

    if (!deleted) {
        return response.success(res, PLAYERS.NOT_FOUND, {}, HTTP.NOT_FOUND);
    }

    return response.success(res, PLAYERS.DELETED, { deletedCount: deleted });
};
