module.exports = (sequelize, DataTypes) => {
  const RoadmapStep = sequelize.define('RoadmapStep', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roadmapId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Roadmaps',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'RoadmapSteps',
    timestamps: true,
  });

  RoadmapStep.associate = (models) => {
    RoadmapStep.belongsTo(models.Roadmap, { foreignKey: 'roadmapId', onDelete: 'CASCADE' });
  };

  return RoadmapStep;
};