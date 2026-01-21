module.exports = (sequelize, DataTypes) => {
    const PlayerMaster = sequelize.define('PlayerMaster', {
        PlayerID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Name: { type: DataTypes.STRING, allowNull: false },
        FatherName: { type: DataTypes.STRING, allowNull: false },
        DOB: { type: DataTypes.DATE },
        Mobile: { type: DataTypes.STRING, allowNull: false, unique: true },
        Email: { type: DataTypes.STRING, unique: true },
        Role: { type: DataTypes.STRING },
        BattingStyle: { type: DataTypes.STRING },
        BowlingStyle: { type: DataTypes.STRING },
        PhotoURL: { type: DataTypes.STRING },
        Notes: { type: DataTypes.STRING },
        Status: { type: DataTypes.STRING },
        CreatedAt: DataTypes.DATE,
        UpdatedAt: DataTypes.DATE
    }, {
        tableName: 'PlayerMasters',
        timestamps: true,
    });

    PlayerMaster.associate = (models) => {
        PlayerMaster.hasMany(models.AuctionPlayer, {
            foreignKey: 'PlayerID',
            as: 'AuctionEntries'
        });
    };

    return PlayerMaster;
};
