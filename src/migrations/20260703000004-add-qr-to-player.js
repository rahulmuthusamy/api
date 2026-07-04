'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Owners', 'QRCodeUrl', {
      type: Sequelize.varchar(255),
      allowNull: true
    });

    await queryInterface.addColumn('PlayerMasters', 'QRCodeUrl', {
      type: Sequelize.varchar(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Owners', 'QRCodeUrl');
    await queryInterface.removeColumn('PlayerMasters', 'QRCodeUrl');
  }
};
