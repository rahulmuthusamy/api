module.exports = (sequelize, DataTypes) => {
    const Tournament = sequelize.define('Tournament', {
        TournamentID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Description: DataTypes.TEXT,
        BannerURL: DataTypes.STRING,
        LogoURL: DataTypes.STRING,
        Type: {
            type: DataTypes.ENUM('League', 'Knockout', 'Hybrid'),
            defaultValue: 'League'
        },
        Status: {
            type: DataTypes.ENUM('Upcoming', 'Ongoing', 'Completed'),
            defaultValue: 'Upcoming'
        },
        StartDate: DataTypes.DATE,
        EndDate: DataTypes.DATE,
        Location: DataTypes.STRING,
        Organizer: DataTypes.STRING,
        PrizePool: DataTypes.STRING,
        Rules: DataTypes.TEXT,
        Category: DataTypes.STRING,
        // Registration Management
        RegistrationStartDate: DataTypes.DATE,
        RegistrationEndDate: DataTypes.DATE,
        IsRegistrationOpen: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        MaxTeams: {
            type: DataTypes.INTEGER,
            defaultValue: 16
        },
        MinTeams: {
            type: DataTypes.INTEGER,
            defaultValue: 4
        },
        CurrentTeamsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // Match Configuration
        MatchFormat: {
            type: DataTypes.ENUM('T20', 'ODI', 'Test', 'T10', 'The100', 'Custom'),
            defaultValue: 'T20'
        },
        OversPerMatch: {
            type: DataTypes.INTEGER,
            defaultValue: 20
        },
        PlayersPerTeam: {
            type: DataTypes.INTEGER,
            defaultValue: 11
        },
        BallsPerOver: {
            type: DataTypes.INTEGER,
            defaultValue: 6
        },
        PowerplayOvers: {
            type: DataTypes.INTEGER,
            defaultValue: 6
        },
        // Financial & Contact
        RegistrationFee: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        ContactEmail: DataTypes.STRING,
        ContactPhone: DataTypes.STRING,
        WebsiteURL: DataTypes.STRING,
        // Visibility
        IsPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        FeaturedImage: DataTypes.STRING,
        // Venue Details
        VenueName: DataTypes.STRING,
        City: DataTypes.STRING,
        State: DataTypes.STRING,
        Country: {
            type: DataTypes.STRING,
            defaultValue: 'India'
        },
        // Tournament Structure
        GroupCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TeamsPerGroup: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        QualifiersCount: {
            type: DataTypes.INTEGER,
            defaultValue: 2
        },
        PointsForWin: {
            type: DataTypes.INTEGER,
            defaultValue: 2
        },
        PointsForTie: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        PointsForNoResult: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    }, {
        tableName: 'Tournaments',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Tournament.associate = (models) => {
        Tournament.belongsToMany(models.TeamMaster, {
            through: 'TournamentTeams',
            foreignKey: 'TournamentID',
            otherKey: 'TeamID',
            as: 'Teams'
        });
        Tournament.hasMany(models.Match, {
            foreignKey: 'TournamentID',
            as: 'Matches'
        });
        Tournament.hasMany(models.TournamentStandings, {
            foreignKey: 'TournamentID',
            as: 'Standings'
        });
    };

    return Tournament;
};
