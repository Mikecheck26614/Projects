const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// Dynamically load all model files
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Explicit associations for clarity
db.User.hasOne(db.Profile, { foreignKey: 'userId', constraints: true, onDelete: 'CASCADE' });
db.Profile.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Roadmap, { foreignKey: 'userId' });
db.Roadmap.belongsTo(db.User, { foreignKey: 'userId' });

db.RoadmapStep.belongsTo(db.Roadmap, { foreignKey: 'roadmapId' });

db.User.hasMany(db.ProfileDocument, { foreignKey: 'userId' });
db.ProfileDocument.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Goal, { foreignKey: 'userId' });
db.Goal.belongsTo(db.User, { foreignKey: 'userId' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;