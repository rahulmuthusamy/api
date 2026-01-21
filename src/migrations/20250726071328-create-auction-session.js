'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuctionSessions', {
      SessionID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Name: Sequelize.STRING,
      Year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      MaxBudget: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      MaxPlayersPerTeam: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Status: {
        type: Sequelize.ENUM('upcoming', 'live', 'completed'),
        defaultValue: 'upcoming'
      },
      Notes: Sequelize.STRING,
      StartDate: Sequelize.DATE,
      EndDate: Sequelize.DATE,
      CreatedAt: Sequelize.DATE,
      UpdatedAt: Sequelize.DATE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AuctionSessions');
  }
};
