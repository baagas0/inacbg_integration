const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuthToken = sequelize.define('AuthToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: 'INACBG_ENCRYPTION_KEY',
    },
    encryption_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'inacbg_auth_tokens',
    timestamps: true,
    updatedAt: 'last_updated',
    createdAt: false,
  });

  return AuthToken;
};
