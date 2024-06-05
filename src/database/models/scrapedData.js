const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScrapedData = sequelize.define('ScrapedData', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false
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

  return ScrapedData;
};
