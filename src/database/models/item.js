const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Item = sequelize.define('Item', {
    id: {
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
      allowNull: false,
      references: {
        model: 'Scrapers',
        key: 'id'
      }
    },
    invalid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'Items',
    timestamps: false
  });

  Item.associate = (models) => {
    Item.belongsTo(models.Scraper, { foreignKey: 'scraper_id' });
    Item.hasMany(models.UserScraperSetting, { foreignKey: 'item_id' });
    Item.hasMany(models.Logging, { foreignKey: 'link' });
  };

  return Item;
};