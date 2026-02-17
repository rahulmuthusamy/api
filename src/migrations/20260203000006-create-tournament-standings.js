'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('TournamentStandings', {
            StandingID: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            TournamentID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Tournaments',
                    key: 'TournamentID'
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
            GroupName: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Group identifier for group stage tournaments'
            },
            MatchesPlayed: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Won: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Lost: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Tied: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            NoResult: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            Points: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Total points (Win=2, Tie/NR=1, Loss=0 typically)'
            },
            RunsScored: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Total runs scored across all matches'
            },
            RunsConceded: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Total runs conceded across all matches'
            },
            OversPlayed: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0,
                comment: 'Total overs played while batting'
            },
            OversBowled: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0,
                comment: 'Total overs bowled'
            },
            NetRunRate: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0,
                comment: 'Net Run Rate (For/Against)'
            },
            Position: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Current position in standings'
            },
            IsQualified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'Whether team has qualified for next stage'
            },
            IsEliminated: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'Whether team is mathematically eliminated'
            },
            Form: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Recent form (e.g., WWLWL for last 5 matches)'
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
        await queryInterface.addIndex('TournamentStandings', ['TournamentID']);
        await queryInterface.addIndex('TournamentStandings', ['TeamID']);
        await queryInterface.addIndex('TournamentStandings', ['GroupName']);
        await queryInterface.addIndex('TournamentStandings', ['Position']);

        // Unique constraint
        await queryInterface.addIndex('TournamentStandings', ['TournamentID', 'TeamID', 'GroupName'], {
            unique: true,
            name: 'unique_tournament_team_group'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('TournamentStandings');
    }
};
