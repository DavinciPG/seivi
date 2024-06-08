const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        archived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        seen: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        link_to: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'notifications',
        timestamps: false
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.User, { foreignKey: 'user_id' });
    };


    return Notification;
};
