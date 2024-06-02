const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

const Item = require('./item');
const User = require('./user');

const ScrapedData = sequelize.define('ScrapedData', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
    data: {
        type: DataTypes.JSON
    },
    scraped_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'ScrapedData',
    timestamps: false
});

module.exports = ScrapedData;