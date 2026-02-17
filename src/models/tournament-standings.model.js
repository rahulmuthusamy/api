module.exports = (sequelize, DataTypes) => {
    const TournamentStandings = sequelize.define('TournamentStandings', {
        StandingID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        TournamentID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        TeamID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        GroupName: DataTypes.STRING,
        MatchesPlayed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Won: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Lost: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Tied: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        NoResult: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        Points: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        RunsScored: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        RunsConceded: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        OversPlayed: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        OversBowled: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        NetRunRate: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        Position: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        IsQualified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        IsEliminated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        Form: DataTypes.STRING
    }, {
        tableName: 'TournamentStandings',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    TournamentStandings.associate = (models) => {
        TournamentStandings.belongsTo(models.Tournament, {
            foreignKey: 'TournamentID',
            as: 'Tournament'
        });
        TournamentStandings.belongsTo(models.TeamMaster, {
            foreignKey: 'TeamID',
            as: 'Team'
        });
    };

    return TournamentStandings;
};
