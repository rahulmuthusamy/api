module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('AuctionPlayers');

    if (!table.IsIconicPlayer) {
      await queryInterface.addColumn('AuctionPlayers', 'IsIconicPlayer', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('AuctionPlayers');

    if (table.IsIconicPlayer) {
      await queryInterface.removeColumn('AuctionPlayers', 'IsIconicPlayer');
    }
  }
};