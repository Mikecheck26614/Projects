const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoadmapStep = sequelize.define('RoadmapStep', {
  roadmapId: {
    type: DataTypes.INTEGER,
    references: { model: 'Roadmaps', key: 'id' }
  },
  description: { type: DataTypes.STRING, allowNull: false },
  order: { type: DataTypes.INTEGER, allowNull: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  deadline: { type: DataTypes.DATE }
});

module.exports = RoadmapStep;