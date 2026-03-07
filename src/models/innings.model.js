module.exports = (sequelize, DataTypes) => {
    const Innings = sequelize.define('Innings', {
        InningsID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        MatchID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        InningsNumber: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        BattingTeamID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        BowlingTeamID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        TotalRuns: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TotalWickets: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TotalOvers: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        TotalBalls: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Extras: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Wides: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        NoBalls: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Byes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        LegByes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Penalties: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        IsDeclared: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        IsAllOut: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        IsCompleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        TargetScore: DataTypes.INTEGER,
        RunRate: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        RequiredRunRate: DataTypes.FLOAT
    }, {
        tableName: 'Innings',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Innings.associate = (models) => {
        Innings.belongsTo(models.Match, {
            foreignKey: 'MatchID',
            as: 'Match'
        });
        Innings.belongsTo(models.TeamMaster, {
            foreignKey: 'BattingTeamID',
            as: 'BattingTeam'
        });
        Innings.belongsTo(models.TeamMaster, {
            foreignKey: 'BowlingTeamID',
            as: 'BowlingTeam'
        });
        Innings.hasMany(models.BallByBall, {
            foreignKey: 'InningsID',
            as: 'Balls'
        });
    };

    return Innings;
};
