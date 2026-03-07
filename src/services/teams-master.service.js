const { TeamMaster, TeamPlayer, PlayerMaster } = require('../models');
const BaseService = require('./base.service');

const service = new BaseService(TeamMaster);

const getAllTeams = async () => {
    return await TeamMaster.findAll({
        include: [{
            model: PlayerMaster,
            as: 'Players',
            through: { where: { Status: 'Active' } },
            required: false
        }]
    });
};

const getTeamsById = async (id) => {
    return await TeamMaster.findByPk(id, {
        include: [{
            model: PlayerMaster,
            as: 'Players',
            through: { where: { Status: 'Active' } },
            required: false
        }]
    });
};

const createTeams = async (data) => {
    let { PlayerIDs, ...teamData } = data;
    const team = await service.create(teamData);

    if (PlayerIDs) {
        if (!Array.isArray(PlayerIDs)) PlayerIDs = [PlayerIDs];

        const teamPlayers = PlayerIDs.map(playerId => ({
            TeamID: team.TeamID,
            PlayerID: playerId,
            JoinedDate: new Date(),
            Status: 'Active'
        }));
        await TeamPlayer.bulkCreate(teamPlayers);
    }

    return team;
};

const updateTeams = async (id, data) => {
    let { PlayerIDs, ...teamData } = data;
    const team = await service.update(id, teamData);

    if (PlayerIDs !== undefined) {
        if (PlayerIDs && !Array.isArray(PlayerIDs)) PlayerIDs = [PlayerIDs];
        const ids = PlayerIDs || [];

        // Set all current players to Inactive
        await TeamPlayer.update({ Status: 'Inactive' }, { where: { TeamID: id } });

        if (ids.length > 0) {
            for (const playerId of ids) {
                const [tp, created] = await TeamPlayer.findOrCreate({
                    where: { TeamID: id, PlayerID: playerId },
                    defaults: { JoinedDate: new Date(), Status: 'Active' }
                });
                if (!created) {
                    tp.Status = 'Active';
                    await tp.save();
                }
            }
        }
    }

    return team;
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
