'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Modify Matches table to allow null for TeamA_ID and TeamB_ID
        await queryInterface.changeColumn('Matches', 'TeamA_ID', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'TeamMasters',
                key: 'TeamID'
            }
        });

        await queryInterface.changeColumn('Matches', 'TeamB_ID', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'TeamMasters',
                key: 'TeamID'
            }
        });

        // Modify Innings table to allow null for BattingTeamID and BowlingTeamID
        await queryInterface.changeColumn('Innings', 'BattingTeamID', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'TeamMasters',
                key: 'TeamID'
            }
        });

        await queryInterface.changeColumn('Innings', 'BowlingTeamID', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'TeamMasters',
                key: 'TeamID'
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Revert changes (Note: this might fail if there are already null values)
        await queryInterface.changeColumn('Matches', 'TeamA_ID', {
            type: Sequelize.INTEGER,
            allowNull: false
        }).catch(err => console.log('Revert failed for TeamA_ID:', err.message));

        await queryInterface.changeColumn('Matches', 'TeamB_ID', {
            type: Sequelize.INTEGER,
            allowNull: false
        }).catch(err => console.log('Revert failed for TeamB_ID:', err.message));

        await queryInterface.changeColumn('Innings', 'BattingTeamID', {
            type: Sequelize.INTEGER,
            allowNull: false
        }).catch(err => console.log('Revert failed for BattingTeamID:', err.message));

        await queryInterface.changeColumn('Innings', 'BowlingTeamID', {
            type: Sequelize.INTEGER,
            allowNull: false
        }).catch(err => console.log('Revert failed for BowlingTeamID:', err.message));
    }
};
