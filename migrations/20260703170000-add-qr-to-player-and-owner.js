// Migration to add QRCodeUrl column to PlayerMasters and Owners tables
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('PlayerMasters', 'QRCodeUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Owners', 'QRCodeUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('PlayerMasters', 'QRCodeUrl');
    await queryInterface.removeColumn('Owners', 'QRCodeUrl');
  }
};
