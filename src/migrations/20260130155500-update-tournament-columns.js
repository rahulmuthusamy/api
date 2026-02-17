'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('Tournaments');

        const columnsToAdd = {
            LogoURL: { type: Sequelize.STRING, allowNull: true },
            Location: { type: Sequelize.STRING, allowNull: true },
            Organizer: { type: Sequelize.STRING, allowNull: true },
            PrizePool: { type: Sequelize.STRING, allowNull: true },
            Rules: { type: Sequelize.TEXT, allowNull: true },
            Category: { type: Sequelize.STRING, allowNull: true }  
        };

        for (const [colName, colDef] of Object.entries(columnsToAdd)) {
            if (!tableInfo[colName]) {
                await queryInterface.addColumn('Tournaments', colName, colDef);
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        const columnsToRemove = [
            'LogoURL', 'Location', 'Organizer', 'PrizePool', 'Rules', 'Category'
        ];

        for (const colName of columnsToRemove) {
            await queryInterface.removeColumn('Tournaments', colName);
        }
    }
};
