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
        key: 'ID'
      }
    }
  }, {
    tableName: 'Items',
    timestamps: false
  });

  Item.associate = (models) => {
    Item.belongsTo(models.Scraper, { foreignKey: 'scraper_id' });
  };

  return Item;
};