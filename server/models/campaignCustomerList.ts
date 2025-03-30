import { Model, DataTypes, Sequelize } from 'sequelize';
import { CampaignCustomerList as CampaignCustomerListType } from '../../shared/schema';

class CampaignCustomerList extends Model<CampaignCustomerListType, CampaignCustomerListType> implements CampaignCustomerListType {
  public campaignId!: string;
  public customerListId!: string;

  // No specific associations needed as this is a junction table
}

export function initCampaignCustomerList(sequelize: Sequelize): typeof CampaignCustomerList {
  CampaignCustomerList.init({
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
    customerListId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'customer_list_id',
      references: {
        model: 'customer_lists',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'CampaignCustomerList',
    tableName: 'campaign_customer_lists',
    underscored: true,
    timestamps: false
  });
  
  return CampaignCustomerList;
}