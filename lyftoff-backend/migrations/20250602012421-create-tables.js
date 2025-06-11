'use strict';
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('Users', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
    });

    await queryInterface.createTable('Profiles', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'Users', key: 'id' },
      },
      firstName: { type: DataTypes.STRING, allowNull: true },
      lastName: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      phoneNumber: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      academicLevel: {
        type: DataTypes.ENUM('high-school', 'university', 'professional'),
        allowNull: true,
      },
      interests: { type: DataTypes.STRING, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      avatarUrl: { type: DataTypes.STRING, allowNull: true },
      longTermGoal: { type: DataTypes.STRING, allowNull: true },
      shortTermGoals: { type: DataTypes.JSON, allowNull: true },
      achievements: { type: DataTypes.JSON, allowNull: true },
      onboarding: { type: DataTypes.JSON, defaultValue: '{}' },
      scenario: { type: DataTypes.TEXT, allowNull: true },
      notifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.createTable('Roadmaps', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      title: { type: DataTypes.STRING, allowNull: false },
      goals: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('planned', 'in-progress', 'completed'),
        defaultValue: 'planned',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.createTable('RoadmapSteps', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roadmapId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Roadmaps', key: 'id' },
      },
      description: { type: DataTypes.TEXT, allowNull: false },
      order: { type: DataTypes.INTEGER, allowNull: false },
      completed: { type: DataTypes.BOOLEAN, defaultValue: false },
      deadline: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.createTable('ProfileDocuments', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      name: { type: DataTypes.STRING, allowNull: false },
      path: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.createTable('Goals', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.ENUM('Academic', 'Career', 'Personal'), allowNull: true },
      priority: { type: DataTypes.ENUM('Low', 'Medium', 'High'), allowNull: true },
      progress: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Goals');
    await queryInterface.dropTable('ProfileDocuments');
    await queryInterface.dropTable('RoadmapSteps');
    await queryInterface.dropTable('Roadmaps');
    await queryInterface.dropTable('Profiles');
    await queryInterface.dropTable('Users');
  },
};