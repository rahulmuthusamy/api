const { TeamMaster, TeamPlayer, PlayerMaster, AuctionTeam, TournamentTeam, TournamentStandings, Match, MatchSquad, PlayerMatchStats, BallByBall, Innings } = require('../models');
const { Op } = require('sequelize');
const BaseService = require('./base.service');

const service = new BaseService(TeamMaster);

const getAllTeams = async () => {
    const teams = await TeamMaster.findAll({
        include: [{
            model: PlayerMaster,
            as: 'Players',
            through: {
                model: TeamPlayer,
                attributes: []
            },
            required: false
        }]
    });
    return teams;
};

const getTeamsById = async (id) => {
    const team = await TeamMaster.findByPk(id, {
        include: [{
            model: PlayerMaster,
            through: {
                attributes: []
            },
            as: 'Players'
        }]
    });
    return team;
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
    const transaction = await TeamMaster.sequelize.transaction();
    try {
        // Delete all dependent child records referencing TeamID
        if (typeof AuctionTeam !== 'undefined') await AuctionTeam.destroy({ where: { TeamID: id }, transaction });
        if (typeof TeamPlayer !== 'undefined') await TeamPlayer.destroy({ where: { TeamID: id }, transaction });
        if (typeof TournamentTeam !== 'undefined') await TournamentTeam.destroy({ where: { TeamID: id }, transaction });
        if (typeof TournamentStandings !== 'undefined') await TournamentStandings.destroy({ where: { TeamID: id }, transaction });
        
        const matches = await Match.findAll({ where: { [Op.or]: [{ TeamA_ID: id }, { TeamB_ID: id }] }, transaction, attributes: ['MatchID'] });
        const matchIds = matches.map(m => m.MatchID);
        if (matchIds.length > 0) {
            if (typeof MatchSquad !== 'undefined') await MatchSquad.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
            if (typeof PlayerMatchStats !== 'undefined') await PlayerMatchStats.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
            if (typeof BallByBall !== 'undefined') await BallByBall.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
            if (typeof Innings !== 'undefined') await Innings.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
        }
        if (typeof Match !== 'undefined') await Match.destroy({ 
            where: { [Op.or]: [{ TeamA_ID: id }, { TeamB_ID: id }] }, 
            transaction 
        });

        // Finally delete the team
        const deletedCount = await TeamMaster.destroy({ where: { TeamID: id }, transaction });
        await transaction.commit();
        return deletedCount;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    getAllTeams,
    getTeamsById,
    createTeams,
    updateTeams,
    deleteTeamsByID
};
