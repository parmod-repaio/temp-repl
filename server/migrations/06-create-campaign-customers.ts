import { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface, Sequelize: any): Promise<void> {
  await queryInterface.createTable('campaign_customers', {
    campaign_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'campaigns',
        key: 'id'
      },
      onDelete: 'CASCADE',
      primaryKey: true
    },
    customer_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      onDelete: 'CASCADE',
      primaryKey: true
    }
  });
}

export async function down(queryInterface: QueryInterface, Sequelize: any): Promise<void> {
  await queryInterface.dropTable('campaign_customers');
}