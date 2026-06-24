'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LocationMasters', {
      LocationID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      Name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      District: {
        type: Sequelize.STRING,
        allowNull: true
      },
      State: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Tamil Nadu'
      },
      IsActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      SortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LocationMasters');
  }
};
