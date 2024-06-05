const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserScraperSetting = sequelize.define('UserScraperSetting', {
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
        key: 'ID'
      },
      onDelete: 'CASCADE'
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Items',
        key: 'ID'
      },
      onDelete: 'CASCADE'
    },
    selected_parameters: {
      type: DataTypes.JSON
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'UserScraperSettings',
    timestamps: false
  });

  return UserScraperSetting;
};
