const { TeamMaster } = require('../models');
const BaseService = require('./base.service');

const service = new BaseService(TeamMaster);

const getAllTeams = async () => {
    return await service.getAll();
};

const getTeamsById = async (id) => {
    return await service.getById(id);
};

const createTeams = async (data) => {
    return await service.create(data);
};

const updateTeams = async (id, data) => {
    return await service.update(id, data);
};

const deleteTeamsByID = async (id) => {
    return await service.delete(id);
};

module.exports = {
    getAllTeams,
    getTeamsById,
    createTeams,
    updateTeams,
    deleteTeamsByID
};
