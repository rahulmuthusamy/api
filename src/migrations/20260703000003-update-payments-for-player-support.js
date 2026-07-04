'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDesc = await queryInterface.describeTable('Payments');

      // Step 1: Make OwnerID nullable (required for ON DELETE SET NULL FK)
      // First, drop the existing FK constraint, change the column, then re-add FK
      if (tableDesc.OwnerID && tableDesc.OwnerID.allowNull === false) {
        // Get existing FK constraints on the table
        const [results] = await queryInterface.sequelize.query(
          `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_NAME = 'Payments' AND TABLE_SCHEMA = DATABASE() 
           AND COLUMN_NAME = 'OwnerID' AND REFERENCED_TABLE_NAME IS NOT NULL`,
          { transaction }
        );
        // Drop each FK on OwnerID
        for (const row of results) {
          await queryInterface.sequelize.query(
            `ALTER TABLE Payments DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
            { transaction }
          );
        }

        // Make OwnerID nullable
        await queryInterface.changeColumn('Payments', 'OwnerID', {
          type: Sequelize.INTEGER,
          allowNull: true
        }, { transaction });

        // Re-add FK with SET NULL
        await queryInterface.addConstraint('Payments', {
          fields: ['OwnerID'],
          type: 'foreign key',
          name: 'Payments_OwnerID_fk',
          references: { table: 'Owners', field: 'OwnerID' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          transaction
        });
      }

      // Step 2: Add PlayerID column
      if (!tableDesc.PlayerID) {
        await queryInterface.addColumn('Payments', 'PlayerID', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'PlayerMasters', key: 'PlayerID' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        }, { transaction });
      }

      // Step 3: Add SessionID column
      if (!tableDesc.SessionID) {
        await queryInterface.addColumn('Payments', 'SessionID', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'AuctionSessions', key: 'SessionID' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        }, { transaction });
      }

      // Step 4: Add PaymentType column
      if (!tableDesc.PaymentType) {
        await queryInterface.addColumn('Payments', 'PaymentType', {
          type: Sequelize.ENUM('owner_registration', 'player_registration', 'other'),
          defaultValue: 'owner_registration',
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
      await queryInterface.removeColumn('Payments', 'PlayerID', { transaction });
      await queryInterface.removeColumn('Payments', 'SessionID', { transaction });
      await queryInterface.removeColumn('Payments', 'PaymentType', { transaction });

      // Revert OwnerID to NOT NULL (drop SET NULL FK, change column, re-add original FK)
      const [results] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME = 'Payments' AND TABLE_SCHEMA = DATABASE() 
         AND COLUMN_NAME = 'OwnerID' AND REFERENCED_TABLE_NAME IS NOT NULL`,
        { transaction }
      );
      for (const row of results) {
        await queryInterface.sequelize.query(
          `ALTER TABLE Payments DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
          { transaction }
        );
      }
      await queryInterface.changeColumn('Payments', 'OwnerID', {
        type: Sequelize.INTEGER,
        allowNull: false
      }, { transaction });
      await queryInterface.addConstraint('Payments', {
        fields: ['OwnerID'],
        type: 'foreign key',
        name: 'Payments_OwnerID_fk_restored',
        references: { table: 'Owners', field: 'OwnerID' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
