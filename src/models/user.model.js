module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        UserID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        Email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        PasswordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Role: {
            type: DataTypes.ENUM('super_admin', 'owner', 'player', 'member'),
            allowNull: false
        }
    }, {
        tableName: 'Users',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    User.associate = (models) => {
        User.hasOne(models.Owner, { foreignKey: 'UserID', as: 'OwnerProfile' });
        User.hasOne(models.Member, { foreignKey: 'UserID', as: 'MemberProfile' });
        User.hasOne(models.PlayerMaster, { foreignKey: 'UserID', as: 'PlayerProfile' });
    };

    return User;
};
