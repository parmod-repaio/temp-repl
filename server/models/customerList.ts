import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { CustomerList as CustomerListType } from '../../shared/schema';

interface CustomerListAttributes extends CustomerListType {}

interface CustomerListCreationAttributes extends Optional<CustomerListAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerList extends Model<CustomerListAttributes, CustomerListCreationAttributes> implements CustomerListAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public userId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Define associations
  static associate(models: any): void {
    CustomerList.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    CustomerList.hasMany(models.Customer, { foreignKey: 'customerListId', as: 'customers' });
    CustomerList.belongsToMany(models.Campaign, { 
      through: 'campaign_customer_lists', 
      foreignKey: 'customerListId',
      otherKey: 'campaignId',
      as: 'campaigns'
    });
  }
}

export function initCustomerList(sequelize: Sequelize): typeof CustomerList {
  CustomerList.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    name: {
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
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'CustomerList',
    tableName: 'customer_lists',
    underscored: true
  });
  
  return CustomerList;
}