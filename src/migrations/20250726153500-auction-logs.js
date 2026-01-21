'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuctionLogs', {
      AuctionLogsID: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      event: Sequelize.STRING,
      SessionID: Sequelize.INTEGER,
      TeamID: Sequelize.INTEGER,
      PlayerID: Sequelize.INTEGER,
      message: Sequelize.TEXT,
      CreatedAt: Sequelize.DATE,
      UpdatedAt: Sequelize.DATE
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auction_logs');
  }
};
