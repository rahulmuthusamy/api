const { Op } = require('sequelize');
const { AuctionSession } = require('../models');
const BaseService = require('./base.service');

const service = new BaseService(AuctionSession);

const getAllAuctionSessions = async () => {
    return await service.getAll();
};

const getUpcomingAuctionSessions = async () => {
    return await service.getAll({
        where: {
            Status: 'upcoming',
            EndDate: {
                [Op.gte]: new Date()
            }
        }
    });
};

const getAuctionSessionById = async (id) => {
    return await service.getById(id);
};

const createAuctionSession = async (data) => {
    return await service.create(data);
};

const updateAuctionSession = async (id, data) => {
    return await service.update(id, data);
};

const deleteAuctionSession = async (id) => {
    return await service.delete(id);
};

module.exports = {
    getAllAuctionSessions,
    getUpcomingAuctionSessions, // Ensure this export is maintained
    getAuctionSessionById,
    createAuctionSession,
    updateAuctionSession,
    deleteAuctionSession
};
