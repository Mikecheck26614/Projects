module.exports = (sequelize, DataTypes) => {
  const Roadmap = sequelize.define('Roadmap', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goals: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('planned', 'in-progress', 'completed'),
      defaultValue: 'planned',
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
    tableName: 'Roadmaps',
    timestamps: true,
  });

  Roadmap.associate = (models) => {
    Roadmap.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Roadmap.hasMany(models.RoadmapStep, { foreignKey: 'roadmapId', as: 'roads', onDelete: 'CASCADE' });
  };

  return Roadmap;
};