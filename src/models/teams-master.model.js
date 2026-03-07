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
        Captain: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Founded: {
            type: DataTypes.STRING,
            allowNull: true
        },
        OwnerName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Contact: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        Slogan: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Coach: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'TeamMasters',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    TeamMaster.associate = function (models) {
        // Auction relationships
        TeamMaster.hasMany(models.AuctionTeam, {
            foreignKey: 'TeamID',
            as: 'AuctionTeams'
        });
        
        // Player relationships (many-to-many through TeamPlayers)
        TeamMaster.belongsToMany(models.PlayerMaster, {
            through: 'TeamPlayers',
            foreignKey: 'TeamID',
            otherKey: 'PlayerID',
            as: 'Players'
        });
        
        // Tournament relationships (many-to-many through TournamentTeams)
        TeamMaster.belongsToMany(models.Tournament, {
            through: 'TournamentTeams',
            foreignKey: 'TeamID',
            otherKey: 'TournamentID',
            as: 'Tournaments'
        });
        
        // Match relationships
        TeamMaster.hasMany(models.Match, {
            foreignKey: 'TeamA_ID',
            as: 'HomeMatches'
        });
        
        TeamMaster.hasMany(models.Match, {
            foreignKey: 'TeamB_ID',
            as: 'AwayMatches'
        });
        
        // Squad relationships
        TeamMaster.hasMany(models.MatchSquad, {
            foreignKey: 'TeamID',
            as: 'MatchSquads'
        });
    };

    return TeamMaster;
};
