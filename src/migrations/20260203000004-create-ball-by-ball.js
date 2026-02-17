'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('BallByBall', {
            BallID: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            InningsID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Innings',
                    key: 'InningsID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
            OverNumber: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Over number (1, 2, 3, etc.)'
            },
            BallNumber: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Ball number in over (1-6 normally)'
            },
            BatsmanID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'PlayerMasters',
                    key: 'PlayerID'
                }
            },
            BatsmanEndID: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'PlayerMasters',
                    key: 'PlayerID'
                },
                comment: 'Non-striker batsman'
            },
            BowlerID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'PlayerMasters',
                    key: 'PlayerID'
                }
            },
            RunsScored: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Runs scored off the bat'
            },
            IsWicket: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            WicketType: {
                type: Sequelize.ENUM('Bowled', 'Caught', 'LBW', 'RunOut', 'Stumped', 'HitWicket', 'HitBallTwice', 'ObstructingField', 'TimedOut', 'Retired'),
                allowNull: true
            },
            DismissedPlayerID: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'PlayerMasters',
                    key: 'PlayerID'
                },
                comment: 'Player who got out'
            },
            FielderID: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'PlayerMasters',
                    key: 'PlayerID'
                },
                comment: 'Fielder involved in dismissal (catch/runout/stumping)'
            },
            IsExtra: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            ExtraType: {
                type: Sequelize.ENUM('Wide', 'NoBall', 'Bye', 'LegBye', 'Penalty'),
                allowNull: true
            },
            ExtraRuns: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            TotalRuns: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Total runs added to score (runs + extras)'
            },
            IsBoundary: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            BoundaryType: {
                type: Sequelize.ENUM('Four', 'Six'),
                allowNull: true
            },
            IsLegalDelivery: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                comment: 'False for wides and no balls'
            },
            Commentary: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Ball commentary/description'
            },
            TeamScore: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Team total after this ball'
            },
            TeamWickets: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Team wickets after this ball'
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

        // Add indexes for performance
        await queryInterface.addIndex('BallByBall', ['InningsID']);
        await queryInterface.addIndex('BallByBall', ['MatchID']);
        await queryInterface.addIndex('BallByBall', ['BatsmanID']);
        await queryInterface.addIndex('BallByBall', ['BowlerID']);
        await queryInterface.addIndex('BallByBall', ['OverNumber', 'BallNumber']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('BallByBall');
    }
};
