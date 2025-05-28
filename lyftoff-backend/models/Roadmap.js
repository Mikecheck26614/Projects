const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Roadmap = sequelize.define('Roadmap', {
  userId: {
    type: DataTypes.INTEGER,
    references: { model: 'Users', key: 'id' }
  },
  title: { type: DataTypes.STRING, allowNull: false },
  goals: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('planned', 'in-progress', 'completed'),
    defaultValue: 'planned'
  }
});

module.exports = Roadmap;