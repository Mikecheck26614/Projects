module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    academicLevel: {
      type: DataTypes.ENUM('high-school', 'university', 'professional'),
      allowNull: true,
    },
    interests: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    longTermGoal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shortTermGoals: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    achievements: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    onboarding: {
      type: DataTypes.JSON,
      defaultValue: '{}',
    },
    scenario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'Profiles',
    timestamps: true,
  });

  Profile.associate = (models) => {
    Profile.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return Profile;
};