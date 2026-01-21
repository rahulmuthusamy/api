const { TeamMaster } = require('../models');

const getAllTeams = async () => {

    return await TeamMaster.findAll();

};

const getTeamsById = async (id) => {

    return await TeamMaster.findByPk(id);
};

const createTeams = async (data) => {

    return await TeamMaster.create(data);
};

const updateTeams = async (id, data) => {

    const players = await TeamMaster.findByPk(id);

    if (!players) return null;

    await players.update(data);

    return players;
};

const deleteTeamsByID = async (id) => {

    return await TeamMaster.destroy({ where: { id } });
};

module.exports = {
    getAllTeams,
    getTeamsById,
    createTeams,
    updateTeams,
    deleteTeamsByID
};
