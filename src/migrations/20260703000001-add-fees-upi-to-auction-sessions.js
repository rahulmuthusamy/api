'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDesc = await queryInterface.describeTable('AuctionSessions');

      if (!tableDesc.PlayerRegistrationFee) {
        await queryInterface.addColumn('AuctionSessions', 'PlayerRegistrationFee', {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0
        }, { transaction });
      }

      if (!tableDesc.OwnerRegistrationFee) {
        await queryInterface.addColumn('AuctionSessions', 'OwnerRegistrationFee', {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0
        }, { transaction });
      }

      if (!tableDesc.UPIScannerImageURL) {
        await queryInterface.addColumn('AuctionSessions', 'UPIScannerImageURL', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }

      if (!tableDesc.UPIName) {
        await queryInterface.addColumn('AuctionSessions', 'UPIName', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }

      if (!tableDesc.UPIId) {
        await queryInterface.addColumn('AuctionSessions', 'UPIId', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('AuctionSessions', 'PlayerRegistrationFee', { transaction });
      await queryInterface.removeColumn('AuctionSessions', 'OwnerRegistrationFee', { transaction });
      await queryInterface.removeColumn('AuctionSessions', 'UPIScannerImageURL', { transaction });
      await queryInterface.removeColumn('AuctionSessions', 'UPIName', { transaction });
      await queryInterface.removeColumn('AuctionSessions', 'UPIId', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
