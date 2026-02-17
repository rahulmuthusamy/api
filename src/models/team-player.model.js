module.exports = (sequelize, DataTypes) => {
    const TeamPlayer = sequelize.define('TeamPlayer', {
        TeamPlayerID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        TeamID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        PlayerID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        JoinedDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        Status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            defaultValue: 'Active'
        }
    }, {
        tableName: 'TeamPlayers',
        timestamps: true
    });

    TeamPlayer.associate = (models) => {
        TeamPlayer.belongsTo(models.TeamMaster, { foreignKey: 'TeamID' });
        TeamPlayer.belongsTo(models.PlayerMaster, { foreignKey: 'PlayerID' });
    };

    return TeamPlayer;
};
