'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('PlayerMatchStats', {
            StatID: {
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
            TeamID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'TeamMasters',
                    key: 'TeamID'
                }
            },
            // Batting Stats
            BattingPosition: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Batting order position'
            },
            RunsScored: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            BallsFaced: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Fours: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Sixes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            StrikeRate: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0,
                comment: 'Batting strike rate'
            },
            IsOut: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            HowOut: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Dismissal description (e.g., c Fielder b Bowler)'
            },
            // Bowling Stats
            OversBowled: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0
            },
            BallsBowled: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            RunsConceded: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            WicketsTaken: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Maidens: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Economy: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0,
                comment: 'Bowling economy rate'
            },
            Wides: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            NoBalls: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            // Fielding Stats
            Catches: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Stumpings: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            RunOuts: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Direct hit or involved in runout'
            },
            // Awards
            IsPlayerOfMatch: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            // Additional
            DidNotBat: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            DidNotBowl: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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

        // Add indexes
        await queryInterface.addIndex('PlayerMatchStats', ['MatchID']);
        await queryInterface.addIndex('PlayerMatchStats', ['PlayerID']);
        await queryInterface.addIndex('PlayerMatchStats', ['TeamID']);

        // Unique constraint to prevent duplicate entries
        await queryInterface.addIndex('PlayerMatchStats', ['MatchID', 'PlayerID'], {
            unique: true,
            name: 'unique_player_match'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('PlayerMatchStats');
    }
};
