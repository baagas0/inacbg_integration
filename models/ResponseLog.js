const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ResponseLog = sequelize.define('ResponseLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    request_payload: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    response_body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    tableName: 'inacbg_response_logs',
    timestamps: true,
    createdAt: 'logged_at',
    updatedAt: false,
  });

  return ResponseLog;
};
