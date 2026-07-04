module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        PaymentID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        OwnerID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        PlayerID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        SessionID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        PaymentType: {
            type: DataTypes.ENUM('owner_registration', 'player_registration', 'other'),
            defaultValue: 'owner_registration'
        },
        Amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        TransactionID: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        ReceiptPath: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Status: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending',
            allowNull: false
        },
        VerifiedBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        VerifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        Notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'Payments',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Payment.associate = (models) => {
        Payment.belongsTo(models.Owner, { foreignKey: 'OwnerID', as: 'Owner' });
        Payment.belongsTo(models.PlayerMaster, { foreignKey: 'PlayerID', as: 'Player' });
        Payment.belongsTo(models.AuctionSession, { foreignKey: 'SessionID', as: 'AuctionSession' });
        Payment.belongsTo(models.User, { foreignKey: 'VerifiedBy', as: 'Verifier' });
    };

    return Payment;
};
