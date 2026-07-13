'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const auctionSessionTable = await queryInterface.describeTable('AuctionSessions');
    const tournamentTable = await queryInterface.describeTable('Tournaments');

    if (!auctionSessionTable.TournamentID) {
      await queryInterface.addColumn('AuctionSessions', 'TournamentID', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Tournaments',
          key: 'TournamentID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tournamentTable.BallType) {
      await queryInterface.addColumn('Tournaments', 'BallType', {
        type: Sequelize.ENUM('Tennis', 'Leather', 'Hard Tennis', 'Other'),
        defaultValue: 'Tennis'
      });
    }

    if (!tournamentTable.PrizeDetails) {
      await queryInterface.addColumn('Tournaments', 'PrizeDetails', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const auctionSessionTable = await queryInterface.describeTable('AuctionSessions');
    const tournamentTable = await queryInterface.describeTable('Tournaments');

    if (tournamentTable.PrizeDetails) {
      await queryInterface.removeColumn('Tournaments', 'PrizeDetails');
    }

    if (tournamentTable.BallType) {
      await queryInterface.removeColumn('Tournaments', 'BallType');
    }

    if (auctionSessionTable.TournamentID) {
      await queryInterface.removeColumn('AuctionSessions', 'TournamentID');
    }
  }
};