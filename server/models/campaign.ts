import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Campaign as CampaignType } from '../../shared/schema';

interface CampaignAttributes extends CampaignType {}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public status!: string;
  public userId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Define associations
  static associate(models: any): void {
    Campaign.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Campaign.belongsToMany(models.CustomerList, {
      through: 'campaign_customer_lists',
      foreignKey: 'campaignId',
      otherKey: 'customerListId',
      as: 'customerLists'
    });
    Campaign.belongsToMany(models.Customer, {
      through: 'campaign_customers',
      foreignKey: 'campaignId',
      otherKey: 'customerId',
      as: 'customers'
    });
  }
}

export function initCampaign(sequelize: Sequelize): typeof Campaign {
  Campaign.init({
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft'
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
    modelName: 'Campaign',
    tableName: 'campaigns',
    underscored: true
  });
  
  return Campaign;
}