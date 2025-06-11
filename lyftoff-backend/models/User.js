module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    academicLevel: {
      type: DataTypes.ENUM('high-school', 'university', 'professional'),
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
    tableName: 'Users',
    timestamps: true,
  });

  User.associate = (models) => {
    User.hasOne(models.Profile, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.Roadmap, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.ProfileDocument, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.Goal, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return User;
};