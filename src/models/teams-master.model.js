module.exports = (sequelize, DataTypes) => {
    const TeamMaster = sequelize.define('TeamMaster', {
        TeamID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        LogoURL: {
            type: DataTypes.STRING,
            allowNull: true
        },
        OwnerName: {
            type: DataTypes.STRING,
            
        },
        Contact: {
            type: DataTypes.STRING,
            
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'TeamMasters',
        timestamps: false
    });

    TeamMaster.associate = function (models) {
        TeamMaster.hasMany(models.AuctionTeam, {
            foreignKey: 'TeamID',
            as: 'AuctionTeams'
        });
    };

    return TeamMaster;
};
