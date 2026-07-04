module.exports = (sequelize, DataTypes) => {
    const Owner = sequelize.define('Owner', {
        OwnerID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        UserID: { type: DataTypes.INTEGER, allowNull: false },
        QRCodeUrl: { type: DataTypes.STRING, allowNull: true },
        FullName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ContactNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        VerificationStatus: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending',
            allowNull: false
        },
        FeePaymentStatus: {
            type: DataTypes.ENUM('unpaid', 'pending_verification', 'paid'),
            defaultValue: 'unpaid',
            allowNull: false
        },
        TeamID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        RequestedSessionID: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'Owners',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Owner.associate = (models) => {
        Owner.belongsTo(models.User, { foreignKey: 'UserID', as: 'User' });
        Owner.belongsTo(models.TeamMaster, { foreignKey: 'TeamID', as: 'Team' });
        Owner.hasMany(models.Payment, { foreignKey: 'OwnerID', as: 'Payments' });
    };

    return Owner;
};
