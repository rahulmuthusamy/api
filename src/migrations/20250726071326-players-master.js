'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PlayerMasters', {
      PlayerID: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      Name: { type: Sequelize.STRING, allowNull: false },
      FatherName: { type: Sequelize.STRING, allowNull: false },
      DOB: { type: Sequelize.DATE },
      Mobile: { type: Sequelize.STRING, allowNull: false, unique: true },
      Email: { type: Sequelize.STRING, unique: true },
      Role: { type: Sequelize.STRING },
      BattingStyle: { type: Sequelize.STRING },
      BowlingStyle: { type: Sequelize.STRING },
      PhotoURL: { type: Sequelize.STRING },
      Notes: { type: Sequelize.STRING },
      Status: { type: Sequelize.STRING },
      CreatedAt: Sequelize.DATE,
      UpdatedAt: Sequelize.DATE
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('PlayerMasters');
  }
};
