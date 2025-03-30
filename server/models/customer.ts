import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Customer as CustomerType } from '../../shared/schema';

interface CustomerAttributes extends CustomerType {}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public phoneNumber?: string;
  public status!: string;
  public customerListId!: string;
  public userId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Define associations
  static associate(models: any): void {
    Customer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Customer.belongsTo(models.CustomerList, { foreignKey: 'customerListId', as: 'customerList' });
    Customer.belongsToMany(models.Campaign, { 
      through: 'campaign_customers', 
      foreignKey: 'customerId',
      otherKey: 'campaignId',
      as: 'campaigns'
    });
  }
}

export function initCustomer(sequelize: Sequelize): typeof Customer {
  Customer.init({
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
      validate: {
        isEmail: true
      }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone_number'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    },
    customerListId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_list_id',
      references: {
        model: 'customer_lists',
        key: 'id'
      }
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
    modelName: 'Customer',
    tableName: 'customers',
    underscored: true
  });
  
  return Customer;
}