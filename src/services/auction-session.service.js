const { AuctionSession } = require('../models');

const getAllAuctionSessions = async () => {

    return await AuctionSession.findAll();

};

const getAuctionSessionById = async (id) => {

    return await AuctionSession.findByPk(id);
};

const createAuctionSession = async (data) => {

    return await AuctionSession.create(data);
};

const updateAuctionSession = async (id, data) => {

    const session = await AuctionSession.findByPk(id);

    if (!session) return null;

    await session.update(data);

    return session;
};

const deleteAuctionSession = async (id) => {
    
    return await AuctionSession.destroy({ where: { id } });
};

module.exports = {
    getAllAuctionSessions,
    getAuctionSessionById,
    createAuctionSession,
    updateAuctionSession,
    deleteAuctionSession,
};
