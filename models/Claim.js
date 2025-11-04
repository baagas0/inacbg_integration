const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Claim = sequelize.define('Claim', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nomor_sep: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nomor_kartu: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nama_pasien: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status_klaim: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    last_inacbg_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'inacbg_claims',
    timestamps: true,
    updatedAt: 'last_updated',
    createdAt: 'created_at',
  });

  return Claim;
};
