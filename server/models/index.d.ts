// Type definitions for server/models/index.js
import { Sequelize } from 'sequelize';

export const db: {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  User: any;
  CustomerList: any;
  Customer: any;
  Campaign: any;
  Activity: any;
};