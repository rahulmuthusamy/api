'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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

    await queryInterface.addColumn('Tournaments', 'BallType', {
      type: Sequelize.ENUM('Tennis', 'Leather', 'Hard Tennis', 'Other'),
      defaultValue: 'Tennis'
    });

    await queryInterface.addColumn('Tournaments', 'PrizeDetails', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tournaments', 'PrizeDetails');
    await queryInterface.removeColumn('Tournaments', 'BallType');
    await queryInterface.removeColumn('AuctionSessions', 'TournamentID');
  }
};
