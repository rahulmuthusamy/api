module.exports = (sequelize, DataTypes) => {
    const MatchSquad = sequelize.define('MatchSquad', {
        SquadID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        MatchID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        TeamID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        PlayerID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        IsPlaying: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        IsCaptain: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        IsWicketKeeper: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'MatchSquads',
        timestamps: true
    });

    MatchSquad.associate = (models) => {
        MatchSquad.belongsTo(models.Match, { foreignKey: 'MatchID' });
        MatchSquad.belongsTo(models.TeamMaster, { foreignKey: 'TeamID' });
        MatchSquad.belongsTo(models.PlayerMaster, { foreignKey: 'PlayerID' });
    };

    return MatchSquad;
};
