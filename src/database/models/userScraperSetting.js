const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

const User = require('./user');
const Item = require('./item');

const UserScraperSetting = sequelize.define('UserScraperSetting', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'ID'
        },
        onDelete: 'CASCADE'
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Item,
            key: 'ID'
        },
        onDelete: 'CASCADE'
    },
    selected_parameters: {
        type: DataTypes.JSON
    },
    createdAt: {
        type: DataTypes.DATE
    },
    updatedAt: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'UserScraperSettings',
    timestamps: false
});

module.exports = UserScraperSetting;