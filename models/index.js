const { Sequelize } = require('sequelize');
const config = require('../config/database').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.AuthToken = require('./AuthToken')(sequelize);
db.ResponseLog = require('./ResponseLog')(sequelize);
db.Claim = require('./Claim')(sequelize);

db.sequelize.sync({ })
  .then(() => {
    console.log('Database & tables created/updated!');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

module.exports = db;
