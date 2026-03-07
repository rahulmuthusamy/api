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

        // New Fields
        Address: { type: DataTypes.TEXT, allowNull: true },
        BattingPosition: { type: DataTypes.STRING, allowNull: true },
        CanKeep: { type: DataTypes.BOOLEAN, defaultValue: false },
        CanCaptain: { type: DataTypes.BOOLEAN, defaultValue: false },
        CanField: { type: DataTypes.BOOLEAN, defaultValue: true },
        Height: { type: DataTypes.STRING, allowNull: true },
        Weight: { type: DataTypes.STRING, allowNull: true },
        JerseySize: { type: DataTypes.STRING, allowNull: true },
        PreviousTeam: { type: DataTypes.STRING, allowNull: true },
        Experience: { type: DataTypes.STRING, allowNull: true },
        Bio: { type: DataTypes.TEXT, allowNull: true },
        Nickname: { type: DataTypes.STRING, allowNull: true },
        EmergencyContact: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'PlayerMasters',
        timestamps: true,
    });

    PlayerMaster.associate = (models) => {
        // Auction relationships
        PlayerMaster.hasMany(models.AuctionPlayer, {
            foreignKey: 'PlayerID',
            as: 'AuctionEntries'
        });

        // Team relationships (many-to-many through TeamPlayers)
        PlayerMaster.belongsToMany(models.TeamMaster, {
            through: 'TeamPlayers',
            foreignKey: 'PlayerID',
            otherKey: 'TeamID',
            as: 'Teams'
        });

        // Match squad relationships
        PlayerMaster.hasMany(models.MatchSquad, {
            foreignKey: 'PlayerID',
            as: 'MatchSquads'
        });

        // Match statistics relationships
        PlayerMaster.hasMany(models.PlayerMatchStats, {
            foreignKey: 'PlayerID',
            as: 'MatchStats'
        });
    };

    return PlayerMaster;
};
