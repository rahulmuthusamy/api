'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Innings', {
            InningsID: {
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
            InningsNumber: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: '1 for first innings, 2 for second innings'
            },
            BattingTeamID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'TeamMasters',
                    key: 'TeamID'
                }
            },
            BowlingTeamID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'TeamMasters',
                    key: 'TeamID'
                }
            },
            TotalRuns: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            TotalWickets: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            TotalOvers: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0,
                comment: 'Overs bowled (e.g., 19.4)'
            },
            TotalBalls: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Total balls bowled'
            },
            Extras: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Total extras (wides + no balls + byes + leg byes)'
            },
            Wides: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            NoBalls: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Byes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            LegByes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Penalties: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            IsDeclared: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'Whether innings was declared (Test cricket)'
            },
            IsAllOut: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            IsCompleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            TargetScore: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Target to chase (for 2nd innings)'
            },
            RunRate: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0,
                comment: 'Current run rate'
            },
            RequiredRunRate: {
                type: Sequelize.FLOAT,
                allowNull: true,
                comment: 'Required run rate (for 2nd innings)'
            },
            CreatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            UpdatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add index for faster queries
        await queryInterface.addIndex('Innings', ['MatchID']);
        await queryInterface.addIndex('Innings', ['BattingTeamID']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Innings');
    }
};
