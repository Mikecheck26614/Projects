const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phoneNumber: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  academicLevel: { type: DataTypes.STRING },
  interests: { type: DataTypes.STRING },
  bio: { type: DataTypes.TEXT },
  avatarUrl: { type: DataTypes.STRING },
  longTermGoal: { type: DataTypes.STRING },
  shortTermGoals: { type: DataTypes.JSON }, // Matches your setup
  achievements: { type: DataTypes.JSON }, // Matches your setup
  onboarding: { 
    type: DataTypes.TEXT, 
    defaultValue: JSON.stringify({}) // Kept as-is, though BOOLEAN might be more typical
  },
  scenario: { type: DataTypes.TEXT },
  notifications: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
}, {
  tableName: 'Profiles',
  timestamps: true
});

module.exports = Profile;