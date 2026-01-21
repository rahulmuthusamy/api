module.exports = (sequelize, DataTypes) => {
    const AuctionTeam = sequelize.define('AuctionTeam', {
        AuctionTeamID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        SessionID: { type: DataTypes.INTEGER },
        TeamID: { type: DataTypes.INTEGER },
        Budget: { type: DataTypes.INTEGER },
        CreatedAt: DataTypes.DATE,
        UpdatedAt: DataTypes.DATE
    }, {
        tableName: 'AuctionTeams',
        timestamps: true,
    });

    AuctionTeam.associate = models => {
        AuctionTeam.belongsTo(models.AuctionSession, { foreignKey: 'SessionID' });
        AuctionTeam.belongsTo(models.AuctionTeam, { foreignKey: 'TeamID' });
    };

    return AuctionTeam;
};
