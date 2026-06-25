const { Op } = require('sequelize');
const { AuctionSession, AuctionTeam, TeamMaster, Tournament, TournamentTeam, AuctionPlayer, AuctionBid, AuctionLog } = require('../models');
const BaseService = require('./base.service');

const service = new BaseService(AuctionSession);

const getAllAuctionSessions = async () => {
    return await AuctionSession.findAll({
        include: [{ model: Tournament, as: 'Tournament', attributes: ['TournamentID', 'Name'] }]
    });
};

const getUpcomingAuctionSessions = async () => {
    const sessions = await AuctionSession.findAll({
        where: {
            Status: { [Op.in]: ['upcoming', 'live'] },
        },
        order: [['StartDate', 'ASC']],
        include: [
            {
                model: AuctionTeam,
                required: false,
                include: [
                    { model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL', 'Location'] }
                ]
            },
            {
                model: Tournament,
                as: 'Tournament',
                attributes: ['TournamentID', 'Name']
            }
        ]
    });
    return sessions;
};

const getAuctionSessionById = async (id) => {
    return await AuctionSession.findByPk(id, {
        include: [{ model: Tournament, as: 'Tournament', attributes: ['TournamentID', 'Name'] }]
    });
};

const createAuctionSession = async (data) => {
    return await service.create(data);
};

const updateAuctionSession = async (id, data) => {
    const updated = await service.update(id, data);
    
    // Auto-transfer teams to tournament if auction is completed
    if (data.Status === 'completed') {
        const session = await AuctionSession.findByPk(id);
        if (session && session.TournamentID) {
            const auctionTeams = await AuctionTeam.findAll({ where: { SessionID: id } });
            
            for (const at of auctionTeams) {
                // Check if already in tournament
                const existing = await TournamentTeam.findOne({
                    where: { TournamentID: session.TournamentID, TeamID: at.TeamID }
                });
                
                if (!existing) {
                    await TournamentTeam.create({
                        TournamentID: session.TournamentID,
                        TeamID: at.TeamID
                    });
                }
            }
        }
    }
    
    return updated;
};

const deleteAuctionSession = async (id) => {
    const transaction = await AuctionSession.sequelize.transaction();
    try {
        if (typeof AuctionTeam !== 'undefined') await AuctionTeam.destroy({ where: { SessionID: id }, transaction });
        if (typeof AuctionPlayer !== 'undefined') await AuctionPlayer.destroy({ where: { SessionID: id }, transaction });
        if (typeof AuctionBid !== 'undefined') await AuctionBid.destroy({ where: { SessionID: id }, transaction });
        if (typeof AuctionLog !== 'undefined') await AuctionLog.destroy({ where: { SessionID: id }, transaction });

        const deletedCount = await AuctionSession.destroy({ where: { SessionID: id }, transaction });
        await transaction.commit();
        return deletedCount;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    getAllAuctionSessions,
    getUpcomingAuctionSessions,
    getAuctionSessionById,
    createAuctionSession,
    updateAuctionSession,
    deleteAuctionSession
};
