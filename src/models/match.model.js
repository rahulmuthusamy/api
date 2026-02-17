module.exports = (sequelize, DataTypes) => {
    const Match = sequelize.define('Match', {
        MatchID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        TournamentID: DataTypes.INTEGER,
        MatchNumber: DataTypes.INTEGER,
        TeamA_ID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        TeamB_ID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        MatchDate: DataTypes.DATE,
        Venue: DataTypes.STRING,
        Status: {
            type: DataTypes.ENUM('Scheduled', 'Live', 'Completed', 'Abandoned'),
            defaultValue: 'Scheduled'
        },
        TossWinnerID: DataTypes.INTEGER,
        TossDecision: DataTypes.ENUM('Bat', 'Bowl'),
        WinnerID: DataTypes.INTEGER,
        ResultNote: DataTypes.STRING,
        CurrentInnings: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        TeamA_Runs: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TeamA_Wickets: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TeamA_Overs: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        TeamB_Runs: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TeamB_Wickets: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TeamB_Overs: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        // Match Classification
        MatchType: {
            type: DataTypes.ENUM('Group', 'Round16', 'QuarterFinal', 'SemiFinal', 'Final', 'ThirdPlace', 'League'),
            defaultValue: 'League'
        },
        GroupName: DataTypes.STRING,
        RoundNumber: DataTypes.INTEGER,
        // Match Format
        MatchFormat: {
            type: DataTypes.ENUM('T20', 'ODI', 'Test', 'T10', 'The100', 'Custom'),
            defaultValue: 'T20'
        },
        OversPerSide: {
            type: DataTypes.INTEGER,
            defaultValue: 20
        },
        BallsPerOver: {
            type: DataTypes.INTEGER,
            defaultValue: 6
        },
        PowerplayOvers: {
            type: DataTypes.INTEGER,
            defaultValue: 6
        },
        // Officials
        Umpire1Name: DataTypes.STRING,
        Umpire2Name: DataTypes.STRING,
        ThirdUmpireName: DataTypes.STRING,
        RefereeName: DataTypes.STRING,
        ScorerName: DataTypes.STRING,
        // Conditions
        WeatherConditions: DataTypes.STRING,
        PitchConditions: DataTypes.STRING,
        TossTime: DataTypes.TIME,
        MatchStartTime: DataTypes.TIME,
        // Media
        StreamURL: DataTypes.STRING,
        HighlightsURL: DataTypes.STRING,
        // DLS
        IsDLSApplied: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        DLSTarget: DataTypes.INTEGER,
        DLSOvers: DataTypes.FLOAT,
        // Additional
        PlayerOfMatchID: DataTypes.INTEGER,
        IsNeutralVenue: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        Attendance: DataTypes.INTEGER,
        MatchNotes: DataTypes.TEXT
    }, {
        tableName: 'Matches',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Match.associate = (models) => {
        Match.belongsTo(models.Tournament, {
            foreignKey: 'TournamentID',
            as: 'Tournament'
        });
        Match.belongsTo(models.TeamMaster, {
            foreignKey: 'TeamA_ID',
            as: 'TeamA'
        });
        Match.belongsTo(models.TeamMaster, {
            foreignKey: 'TeamB_ID',
            as: 'TeamB'
        });
        Match.belongsTo(models.TeamMaster, {
            foreignKey: 'TossWinnerID',
            as: 'TossWinner'
        });
        Match.belongsTo(models.TeamMaster, {
            foreignKey: 'WinnerID',
            as: 'Winner'
        });
        Match.hasMany(models.Innings, {
            foreignKey: 'MatchID',
            as: 'Innings'
        });
        Match.hasMany(models.BallByBall, {
            foreignKey: 'MatchID',
            as: 'Balls'
        });
        Match.hasMany(models.PlayerMatchStats, {
            foreignKey: 'MatchID',
            as: 'PlayerStats'
        });
        Match.hasMany(models.MatchSquad, {
            foreignKey: 'MatchID',
            as: 'Squads'
        });
        Match.belongsTo(models.PlayerMaster, {
            foreignKey: 'PlayerOfMatchID',
            as: 'PlayerOfMatch'
        });
    };

    return Match;
};
