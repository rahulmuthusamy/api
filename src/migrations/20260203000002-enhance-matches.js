'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('Matches');

        const addColumnIfNotExists = async (colName, colDef) => {
            if (!tableInfo[colName]) {
                await queryInterface.addColumn('Matches', colName, colDef);
            }
        };

        await addColumnIfNotExists('MatchType', {
            type: Sequelize.ENUM('Group', 'Round16', 'QuarterFinal', 'SemiFinal', 'Final', 'ThirdPlace', 'League'),
            defaultValue: 'League'
        });

        await addColumnIfNotExists('GroupName', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Group identifier (e.g., Group A, Group B)'
        });

        await addColumnIfNotExists('RoundNumber', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Round number in league format'
        });

        await addColumnIfNotExists('MatchFormat', {
            type: Sequelize.ENUM('T20', 'ODI', 'Test', 'T10', 'The100', 'Custom'),
            defaultValue: 'T20'
        });

        await addColumnIfNotExists('OversPerSide', {
            type: Sequelize.INTEGER,
            defaultValue: 20
        });

        await addColumnIfNotExists('BallsPerOver', {
            type: Sequelize.INTEGER,
            defaultValue: 6
        });

        await addColumnIfNotExists('Umpire1Name', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfNotExists('Umpire2Name', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfNotExists('ThirdUmpireName', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfNotExists('RefereeName', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfNotExists('ScorerName', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfNotExists('WeatherConditions', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'e.g., Sunny, Cloudy, Rainy'
        });

        await addColumnIfNotExists('PitchConditions', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'e.g., Batting-friendly, Bowling-friendly'
        });

        await addColumnIfNotExists('TossTime', {
            type: Sequelize.TIME,
            allowNull: true
        });

        await addColumnIfNotExists('MatchStartTime', {
            type: Sequelize.TIME,
            allowNull: true
        });

        await addColumnIfNotExists('StreamURL', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Live streaming URL'
        });

        await addColumnIfNotExists('HighlightsURL', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfNotExists('PowerplayOvers', {
            type: Sequelize.INTEGER,
            defaultValue: 6
        });

        await addColumnIfNotExists('IsDLSApplied', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Duckworth-Lewis-Stern method applied'
        });

        await addColumnIfNotExists('DLSTarget', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Revised target if DLS applied'
        });

        await addColumnIfNotExists('DLSOvers', {
            type: Sequelize.FLOAT,
            allowNull: true,
            comment: 'Revised overs if DLS applied'
        });

        await addColumnIfNotExists('PlayerOfMatchID', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'PlayerMasters',
                key: 'PlayerID'
            }
        });

        await addColumnIfNotExists('IsNeutralVenue', {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        });

        await addColumnIfNotExists('Attendance', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Number of spectators'
        });

        await addColumnIfNotExists('MatchNotes', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Additional match notes or highlights'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove all added columns
        const columns = [
            'MatchType', 'GroupName', 'RoundNumber', 'MatchFormat', 'OversPerSide',
            'BallsPerOver', 'Umpire1Name', 'Umpire2Name', 'ThirdUmpireName', 'RefereeName',
            'ScorerName', 'WeatherConditions', 'PitchConditions', 'TossTime', 'MatchStartTime',
            'StreamURL', 'HighlightsURL', 'PowerplayOvers', 'IsDLSApplied', 'DLSTarget',
            'DLSOvers', 'PlayerOfMatchID', 'IsNeutralVenue', 'Attendance', 'MatchNotes'
        ];

        for (const col of columns) {
            await queryInterface.removeColumn('Matches', col).catch(() => { });
        }
    }
};
