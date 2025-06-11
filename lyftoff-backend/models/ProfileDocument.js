module.exports = (sequelize, DataTypes) => {
  const ProfileDocument = sequelize.define('ProfileDocument', {
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
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: 'ProfileDocuments',
    timestamps: true,
  });

  ProfileDocument.associate = (models) => {
    ProfileDocument.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return ProfileDocument;
};