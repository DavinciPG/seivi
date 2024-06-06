const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Logging = sequelize.define('Logging', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      type: {
        type: DataTypes.STRING(40),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      message: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      logged_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
  }, {
    tableName: 'Logging',
    timestamps: false
  });

  Logging.associate = (models) => {
    Logging.belongsTo(models.Item, { foreignKey: 'link' });
  };

  return Logging;
};