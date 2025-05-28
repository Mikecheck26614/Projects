const { Model } = require('sequelize');
   const { v4: uuidv4 } = require('uuid');

   module.exports = (sequelize, DataTypes) => {
     class Goal extends Model {
       static associate(models) {
         Goal.belongsTo(models.User, { foreignKey: 'userId' });
       }
     }
     Goal.init({
       id: {
         type: DataTypes.UUID,
         defaultValue: () => uuidv4(),
         primaryKey: true,
       },
       userId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: { model: 'Users', key: 'id' },
       },
       title: DataTypes.STRING,
       description: DataTypes.TEXT,
       category: DataTypes.STRING,
       priority: DataTypes.STRING,
       milestones: DataTypes.JSON,
       deadline: DataTypes.DATE,
       resources: DataTypes.JSON,
       reflection: DataTypes.TEXT,
       progress: DataTypes.INTEGER,
     }, {
       sequelize,
       modelName: 'Goal',
     });
     return Goal;
   };