import { Sequelize } from 'sequelize';
import { createSequelizeInstance } from '../../sequelizerc';
import { initUser } from './user';
import { initCustomerList } from './customerList';
import { initCustomer } from './customer';
import { initCampaign } from './campaign';
import { initActivity } from './activity';
import { initCampaignCustomerList } from './campaignCustomerList';
import { initCampaignCustomer } from './campaignCustomer';

// Create a Sequelize instance using our TypeScript configuration
const sequelize = createSequelizeInstance();

// Initialize models
const User = initUser(sequelize);
const CustomerList = initCustomerList(sequelize);
const Customer = initCustomer(sequelize);
const Campaign = initCampaign(sequelize);
const Activity = initActivity(sequelize);
const CampaignCustomerList = initCampaignCustomerList(sequelize);
const CampaignCustomer = initCampaignCustomer(sequelize);

// Setup associations
const models = {
  User,
  CustomerList,
  Customer,
  Campaign,
  Activity,
  CampaignCustomerList,
  CampaignCustomer
};

Object.values(models)
  .filter((model: any) => typeof model.associate === 'function')
  .forEach((model: any) => model.associate(models));

export const db = {
  sequelize,
  Sequelize,
  ...models
};

export default db;