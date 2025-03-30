import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User as UserType } from '../../shared/schema';

interface UserAttributes extends UserType {}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Define associations
  static associate(models: any): void {
    User.hasMany(models.CustomerList, { foreignKey: 'userId', as: 'customerLists' });
    User.hasMany(models.Campaign, { foreignKey: 'userId', as: 'campaigns' });
    User.hasMany(models.Customer, { foreignKey: 'userId', as: 'customers' });
    User.hasMany(models.Activity, { foreignKey: 'userId', as: 'activities' });
  }
}

export function initUser(sequelize: Sequelize): typeof User {
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true
  });
  
  return User;
}