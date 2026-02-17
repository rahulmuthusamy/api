module.exports = (sequelize, DataTypes) => {
    const BallByBall = sequelize.define('BallByBall', {
        BallID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        InningsID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        MatchID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        OverNumber: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        BallNumber: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        BatsmanID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        BatsmanEndID: DataTypes.INTEGER,
        BowlerID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        RunsScored: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        IsWicket: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        WicketType: {
            type: DataTypes.ENUM('Bowled', 'Caught', 'LBW', 'RunOut', 'Stumped', 'HitWicket', 'HitBallTwice', 'ObstructingField', 'TimedOut', 'Retired'),
            allowNull: true
        },
        DismissedPlayerID: DataTypes.INTEGER,
        FielderID: DataTypes.INTEGER,
        IsExtra: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        ExtraType: {
            type: DataTypes.ENUM('Wide', 'NoBall', 'Bye', 'LegBye', 'Penalty'),
            allowNull: true
        },
        ExtraRuns: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TotalRuns: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        IsBoundary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        BoundaryType: {
            type: DataTypes.ENUM('Four', 'Six'),
            allowNull: true
        },
        IsLegalDelivery: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        Commentary: DataTypes.TEXT,
        TeamScore: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TeamWickets: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'BallByBall',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    BallByBall.associate = (models) => {
        BallByBall.belongsTo(models.Innings, {
            foreignKey: 'InningsID',
            as: 'Innings'
        });
        BallByBall.belongsTo(models.Match, {
            foreignKey: 'MatchID',
            as: 'Match'
        });
        BallByBall.belongsTo(models.PlayerMaster, {
            foreignKey: 'BatsmanID',
            as: 'Batsman'
        });
        BallByBall.belongsTo(models.PlayerMaster, {
            foreignKey: 'BatsmanEndID',
            as: 'NonStriker'
        });
        BallByBall.belongsTo(models.PlayerMaster, {
            foreignKey: 'BowlerID',
            as: 'Bowler'
        });
        BallByBall.belongsTo(models.PlayerMaster, {
            foreignKey: 'DismissedPlayerID',
            as: 'DismissedPlayer'
        });
        BallByBall.belongsTo(models.PlayerMaster, {
            foreignKey: 'FielderID',
            as: 'Fielder'
        });
    };

    return BallByBall;
};
