import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Activity as ActivityType } from '../../shared/schema';

interface ActivityAttributes extends ActivityType {}

interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'createdAt'> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  public id!: string;
  public title!: string;
  public description?: string;
  public userId!: string;
  public createdAt!: Date;

  // Define associations
  static associate(models: any): void {
    Activity.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

export function initActivity(sequelize: Sequelize): typeof Activity {
  Activity.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Activity',
    tableName: 'activities',
    underscored: true,
    timestamps: false
  });
  
  return Activity;
}