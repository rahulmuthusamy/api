module.exports = (sequelize, DataTypes) => {
    const PlayerMatchStats = sequelize.define('PlayerMatchStats', {
        StatID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        MatchID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        PlayerID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        TeamID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // Batting Stats
        BattingPosition: DataTypes.INTEGER,
        RunsScored: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        BallsFaced: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Fours: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Sixes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        StrikeRate: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        IsOut: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        HowOut: DataTypes.STRING,
        // Bowling Stats
        OversBowled: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        BallsBowled: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        RunsConceded: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        WicketsTaken: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Maidens: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Economy: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        Wides: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        NoBalls: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // Fielding Stats
        Catches: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Stumpings: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        RunOuts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // Awards
        IsPlayerOfMatch: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        // Additional
        DidNotBat: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        DidNotBowl: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'PlayerMatchStats',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    PlayerMatchStats.associate = (models) => {
        PlayerMatchStats.belongsTo(models.Match, {
            foreignKey: 'MatchID',
            as: 'Match'
        });
        PlayerMatchStats.belongsTo(models.PlayerMaster, {
            foreignKey: 'PlayerID',
            as: 'Player'
        });
        PlayerMatchStats.belongsTo(models.TeamMaster, {
            foreignKey: 'TeamID',
            as: 'Team'
        });
    };

    return PlayerMatchStats;
};
