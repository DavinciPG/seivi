const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

const Item = sequelize.define('Item', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    scraper_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    tableName: 'Items',
    timestamps: false
});

module.exports = Item;
