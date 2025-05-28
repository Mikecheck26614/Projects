const sequelize = require('../config/database');
const User = require('./User');
const Profile = require('./Profile');
const Roadmap = require('./Roadmap');
const RoadmapStep = require('./RoadmapStep');
const ProfileDocument = require('./ProfileDocument');

// Define associations
User.hasOne(Profile, { foreignKey: 'userId', constraints: true, onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Roadmap, { foreignKey: 'userId' });
Roadmap.belongsTo(User, { foreignKey: 'userId' });

Roadmap.hasMany(RoadmapStep, { foreignKey: 'roadmapId', as: 'RoadmapSteps' });
RoadmapStep.belongsTo(Roadmap, { foreignKey: 'roadmapId' });

User.hasMany(ProfileDocument, { foreignKey: 'userId' });
ProfileDocument.belongsTo(User, { foreignKey: 'userId' });

// Sync database schema
(async () => {
  try {
    await sequelize.sync({ alter: true }); // Adds missing columns without dropping data
    console.log('Database schema synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
})();

module.exports = {
  sequelize,
  User,
  Profile,
  Roadmap,
  RoadmapStep,
  ProfileDocument
};