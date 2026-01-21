'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuctionBids', {
      AuctionBidsID: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      PlayerID: Sequelize.INTEGER,
      TeamID: Sequelize.INTEGER,
      SessionID: Sequelize.INTEGER,
      BidAmount: Sequelize.INTEGER,
      CreatedAt: Sequelize.DATE,
      UpdatedAt: Sequelize.DATE
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AuctionBids');
  }
};
