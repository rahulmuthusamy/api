'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuctionTeams', {
      AuctionTeamID: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      SessionID: {
        type: Sequelize.INTEGER,
        references: { model: 'AuctionSessions', key: 'SessionID' }
      },
      TeamID: {
        type: Sequelize.INTEGER,
        references: { model: 'TeamMasters', key: 'TeamID' }
      },
      Budget: Sequelize.INTEGER,
      CreatedAt: Sequelize.DATE,
      UpdatedAt: Sequelize.DATE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AuctionTeams');
  }
};
