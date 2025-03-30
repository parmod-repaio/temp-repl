import { Model, DataTypes, Sequelize } from 'sequelize';
import { CampaignCustomer as CampaignCustomerType } from '../../shared/schema';

class CampaignCustomer extends Model<CampaignCustomerType, CampaignCustomerType> implements CampaignCustomerType {
  public campaignId!: string;
  public customerId!: string;

  // No specific associations needed as this is a junction table
}

export function initCampaignCustomer(sequelize: Sequelize): typeof CampaignCustomer {
  CampaignCustomer.init({
    campaignId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'campaign_id',
      references: {
        model: 'campaigns',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'customer_id',
      references: {
        model: 'customers',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'CampaignCustomer',
    tableName: 'campaign_customers',
    underscored: true,
    timestamps: false
  });
  
  return CampaignCustomer;
}