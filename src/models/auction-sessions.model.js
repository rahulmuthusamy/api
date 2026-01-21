
module.exports = (sequelize, DataTypes) => {
    const AuctionSession = sequelize.define('AuctionSession', {
        SessionID: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        Name: DataTypes.STRING,
        Status: {
            type: DataTypes.ENUM('upcoming', 'live', 'completed'),
            defaultValue: 'upcoming',

        },
        Year: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        MaxBudget: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        MaxPlayersPerTeam: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        Notes: DataTypes.STRING,
        StartDate: DataTypes.DATE,
        EndDate: DataTypes.DATE,
        CreatedAt: DataTypes.DATE,
        UpdatedAt: DataTypes.DATE
    }, {
        tableName: 'AuctionSessions',
        timestamps: true,

    });

    AuctionSession.associate = models => {
        AuctionSession.hasMany(models.AuctionPlayer, { foreignKey: 'SessionID' });
        AuctionSession.hasMany(models.AuctionTeam, { foreignKey: 'SessionID' });
    };

    return AuctionSession;
};
