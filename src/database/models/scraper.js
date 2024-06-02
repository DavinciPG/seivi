const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

const Scraper = sequelize.define('Scraper', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    supported_parameters: {
        type: DataTypes.JSON
    },
    createdAt: {
        type: DataTypes.DATE
    },
    updatedAt: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'Scrapers',
    timestamps: false
});

module.exports = Scraper;