'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDesc = await queryInterface.describeTable('AuctionPlayers');

      if (!tableDesc.ApprovalStatus) {
        await queryInterface.addColumn('AuctionPlayers', 'ApprovalStatus', {
          type: Sequelize.ENUM('pending', 'approved', 'rejected'),
          defaultValue: 'pending',
          allowNull: false
        }, { transaction });
      }

      if (!tableDesc.PaymentStatus) {
        await queryInterface.addColumn('AuctionPlayers', 'PaymentStatus', {
          type: Sequelize.ENUM('unpaid', 'pending_verification', 'paid'),
          defaultValue: 'unpaid',
          allowNull: false
        }, { transaction });
      }

      if (!tableDesc.TransactionID) {
        await queryInterface.addColumn('AuctionPlayers', 'TransactionID', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }

      if (!tableDesc.ReceiptPath) {
        await queryInterface.addColumn('AuctionPlayers', 'ReceiptPath', {
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
      await queryInterface.removeColumn('AuctionPlayers', 'ApprovalStatus', { transaction });
      await queryInterface.removeColumn('AuctionPlayers', 'PaymentStatus', { transaction });
      await queryInterface.removeColumn('AuctionPlayers', 'TransactionID', { transaction });
      await queryInterface.removeColumn('AuctionPlayers', 'ReceiptPath', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
