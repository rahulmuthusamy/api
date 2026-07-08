module.exports = (sequelize, DataTypes) => {
    const AuctionPlayer = sequelize.define('AuctionPlayer', {
        AuctionPlayerID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        SessionID: { type: DataTypes.INTEGER },
        PlayerID: { type: DataTypes.INTEGER },
        TeamID: { type: DataTypes.INTEGER, allowNull: true },
        BasePrice: DataTypes.INTEGER,
        SoldPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
        Status: {
            type: DataTypes.ENUM('available', 'live', 'sold', 'unsold', 'skipped'),
            defaultValue: 'available'
        },
        CurrentBid: DataTypes.INTEGER,
        HighestBidTeamID: DataTypes.INTEGER,
        ApprovalStatus: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        PaymentStatus: {
            type: DataTypes.ENUM('unpaid', 'pending_verification', 'paid'),
            defaultValue: 'unpaid'
        },
        TransactionID: DataTypes.STRING,
        ReceiptPath: DataTypes.STRING,
        IsIconicPlayer: DataTypes.BOOLEAN,
        CreatedAt: DataTypes.DATE,
        UpdatedAt: DataTypes.DATE
    }, {
        tableName: 'AuctionPlayers',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    AuctionPlayer.associate = (models) => {
        AuctionPlayer.belongsTo(models.AuctionSession, { foreignKey: 'SessionID' });
        AuctionPlayer.belongsTo(models.PlayerMaster, { foreignKey: 'PlayerID' });
        AuctionPlayer.belongsTo(models.TeamMaster, { foreignKey: 'TeamID', as: 'WinningTeam' });
    };

    return AuctionPlayer;
};
