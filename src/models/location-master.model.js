module.exports = (sequelize, DataTypes) => {
    const LocationMaster = sequelize.define('LocationMaster', {
        LocationID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        District: {
            type: DataTypes.STRING,
            allowNull: true
        },
        State: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'Tamil Nadu'
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        SortOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'LocationMasters',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    return LocationMaster;
};
