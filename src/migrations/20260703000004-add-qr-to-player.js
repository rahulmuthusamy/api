'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const owners = await queryInterface.describeTable('Owners');
    const players = await queryInterface.describeTable('PlayerMasters');

    if (!owners.QRCodeUrl) {
      await queryInterface.addColumn('Owners', 'QRCodeUrl', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (!players.QRCodeUrl) {
      await queryInterface.addColumn('PlayerMasters', 'QRCodeUrl', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const owners = await queryInterface.describeTable('Owners');
    const players = await queryInterface.describeTable('PlayerMasters');

    if (owners.QRCodeUrl) {
      await queryInterface.removeColumn('Owners', 'QRCodeUrl');
    }

    if (players.QRCodeUrl) {
      await queryInterface.removeColumn('PlayerMasters', 'QRCodeUrl');
    }
  }
};