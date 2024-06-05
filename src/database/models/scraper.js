const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Scraper = sequelize.define('Scraper', {
    id: {
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
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'Scrapers',
    timestamps: false
  });

  Scraper.associate = (models) => {
    Scraper.hasMany(models.Item, { foreignKey: 'scraper_id' });
  };

  return Scraper;
};
