const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

const Item = require('./item');

const ScrapedData = sequelize.define('ScrapedData', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Item,
            key: 'link'
        }
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