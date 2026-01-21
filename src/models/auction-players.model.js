module.exports = (sequelize, DataTypes) => {
    const AuctionPlayer = sequelize.define('AuctionPlayer', {
        AuctionPlayerID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        SessionID: {
            type: DataTypes.INTEGER,
        },
        PlayerID: {
            type: DataTypes.INTEGER,
        },
        BasePrice: DataTypes.INTEGER,
        Status: {
            type: DataTypes.ENUM('available', 'live', 'sold', 'skipped'),
            defaultValue: 'available'
        },
        CurrentBid: DataTypes.INTEGER,
        HighestBidTeamID: DataTypes.INTEGER,
        CreatedAt: DataTypes.DATE,
        UpdatedAt: DataTypes.DATE
    }, {
        tableName: 'AuctionPlayers',
        timestamps: true
    });

    AuctionPlayer.associate = (models) => {
        AuctionPlayer.belongsTo(models.AuctionSession, { foreignKey: 'SessionID' });
        AuctionPlayer.belongsTo(models.PlayerMaster, { foreignKey: 'PlayerID' });
    };

    return AuctionPlayer;
};
