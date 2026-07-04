
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
        TournamentID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Tournaments',
                key: 'TournamentID'
            }
        },
        PlayerRegistrationFee: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0
        },
        OwnerRegistrationFee: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0
        },
        UPIScannerImageURL: DataTypes.STRING,
        UPIName: DataTypes.STRING,
        UPIId: DataTypes.STRING,
        Notes: DataTypes.STRING,
        StartDate: DataTypes.DATE,
        EndDate: DataTypes.DATE,
        CreatedAt: DataTypes.DATE,
        UpdatedAt: DataTypes.DATE
    }, {
        tableName: 'AuctionSessions',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'

    });

    AuctionSession.associate = models => {
        AuctionSession.hasMany(models.AuctionPlayer, { foreignKey: 'SessionID' });
        AuctionSession.hasMany(models.AuctionTeam, { foreignKey: 'SessionID' });
        AuctionSession.belongsTo(models.Tournament, { foreignKey: 'TournamentID', as: 'Tournament' });
    };

    return AuctionSession;
};
