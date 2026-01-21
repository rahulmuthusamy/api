'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AuctionPlayers', {
      AuctionPlayerID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      SessionID: {
        type: Sequelize.INTEGER,
        references: { model: 'AuctionSessions', key: 'SessionID' }
      },
      PlayerID: {
        type: Sequelize.INTEGER,
        references: { model: 'PlayerMasters', key: 'PlayerID' }
      },
      BasePrice: Sequelize.INTEGER,
      Status: {
        type: Sequelize.ENUM('available', 'live', 'sold', 'skipped'),
        defaultValue: 'available'
      },
      CurrentBid: Sequelize.INTEGER,
      HighestBidTeamID: Sequelize.INTEGER,
      CreatedAt: Sequelize.DATE,
      UpdatedAt: Sequelize.DATE
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('AuctionPlayers');
  }
};

