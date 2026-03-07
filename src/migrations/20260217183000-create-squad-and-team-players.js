'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create TeamPlayers table
        await queryInterface.createTable('TeamPlayers', {
            TeamPlayerID: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            TeamID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'TeamMasters',
                    key: 'TeamID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            PlayerID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'PlayerMasters',
                    key: 'PlayerID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            JoinedDate: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            Status: {
                type: Sequelize.ENUM('Active', 'Inactive'),
                defaultValue: 'Active'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create MatchSquads table
        await queryInterface.createTable('MatchSquads', {
            SquadID: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            MatchID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Matches',
                    key: 'MatchID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            TeamID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'TeamMasters',
                    key: 'TeamID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            PlayerID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'PlayerMasters',
                    key: 'PlayerID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            IsPlaying: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            IsCaptain: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            IsWicketKeeper: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes
        await queryInterface.addIndex('TeamPlayers', ['TeamID', 'PlayerID']);
        await queryInterface.addIndex('MatchSquads', ['MatchID', 'TeamID']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('MatchSquads');
        await queryInterface.dropTable('TeamPlayers');
    }
};
