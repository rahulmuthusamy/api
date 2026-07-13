'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
     const players = await queryInterface.describeTable('PlayerMasters');
 
    if (!players.AadharURL) {
      await queryInterface.addColumn('PlayerMasters', 'AadharURL', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
     const players = await queryInterface.describeTable('PlayerMasters');
 
    if (players.AadharURL) {
      await queryInterface.removeColumn('PlayerMasters', 'AadharURL ');
    }
  }
};