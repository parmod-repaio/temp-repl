import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import connectPgSimple from 'connect-pg-simple';
import { Op } from 'sequelize';
import { db } from './db';
import { 
  User, InsertUser,
  CustomerList, InsertCustomerList,
  Customer, InsertCustomer,
  Campaign, InsertCampaign,
  Activity, InsertActivity,
  CsvCustomerData
} from '@shared/schema';

// Helper function to extract clean data from Sequelize models
export function extractModelData<T>(model: any): T {
  if (!model) return model;
  return model.dataValues ? model.dataValues : model;
}

// Extended interfaces for Sequelize models with association methods
interface ExtendedCampaign extends Campaign {
  customerLists?: CustomerList[];
  customers?: Customer[];
  setCustomerLists(customerLists: any[], options?: any): Promise<void>;
  addCustomerLists(customerLists: any[], options?: any): Promise<void>;
  setCustomers(customers: any[], options?: any): Promise<void>;
  addCustomers(customers: any[], options?: any): Promise<void>;
}

interface ExtendedCustomerList extends CustomerList {
  campaigns?: Campaign[];
}

interface ExtendedCustomer extends Customer {
  addCampaign(campaign: any, options?: any): Promise<void>;
}

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  
  // CustomerList methods
  createCustomerList(customerList: InsertCustomerList): Promise<CustomerList>;
  getCustomerLists(userId: string): Promise<CustomerList[]>;
  getCustomerListById(id: string, userId: string): Promise<CustomerList | undefined>;
  updateCustomerList(id: string, customerListData: Partial<CustomerList>): Promise<CustomerList>;
  deleteCustomerList(id: string): Promise<void>;
  
  // Customer methods
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  createCustomersFromCSV(csvData: CsvCustomerData[], listId: string, userId: string): Promise<Customer[]>;
  getCustomers(userId: string): Promise<Customer[]>;
  getCustomerById(id: string, userId: string): Promise<Customer | undefined>;
  getCustomersByListId(listId: string): Promise<Customer[]>;
  updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Campaign methods
  createCampaign(campaign: InsertCampaign, customerListIds: string[]): Promise<Campaign>;
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaignById(id: string, userId: string): Promise<Campaign | undefined>;
  updateCampaign(id: string, campaignData: Partial<Campaign>): Promise<Campaign>;
  updateCampaignWithLists(id: string, campaignData: Partial<Campaign>, customerListIds: string[]): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  getCustomerListsByCampaignId(campaignId: string): Promise<CustomerList[]>;
  getCustomersByCampaignId(campaignId: string): Promise<Customer[]>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(userId: string, limit?: number): Promise<Activity[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create PostgreSQL session store
    const PostgresStore = connectPgSimple(session);
    this.sessionStore = new PostgresStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      },
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    console.log("Storage - getUserById - User ID:", id);
    try {
      const user = await db.User.findByPk(id);
      if (user) {
        console.log("Storage - getUserById - Found user");
        return user;
      } else {
        console.log("Storage - getUserById - User not found");
        return undefined;
      }
    } catch (error) {
      console.error("Storage - getUserById - Error:", error);
      throw error;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await db.User.findOne({
      where: { email }
    });
    return user || undefined;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    return await db.User.create({
      ...userData,
      id: uuidv4()
    });
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = await db.User.findByPk(id);
    if (!user) throw new Error('User not found');
    return await user.update(userData);
  }
  
  // CustomerList methods
  async createCustomerList(customerListData: InsertCustomerList): Promise<CustomerList> {
    return await db.CustomerList.create({
      ...customerListData,
      id: uuidv4()
    });
  }
  
  async getCustomerLists(userId: string): Promise<CustomerList[]> {
    console.log("Storage - getCustomerLists - userId:", userId);
    try {
      const lists = await db.CustomerList.findAll({
        where: { userId }, // This should be automatically mapped to user_id by Sequelize underscored option
        order: [['createdAt', 'DESC']]
      });
      console.log("Storage - getCustomerLists - Found lists:", lists.length);
      return lists;
    } catch (error) {
      console.error("Storage - getCustomerLists - Error:", error);
      throw error;
    }
  }
  
  async getCustomerListById(id: string, userId: string): Promise<CustomerList | undefined> {
    const customerList = await db.CustomerList.findOne({
      where: {
        id,
        userId
      }
    });
    return customerList || undefined;
  }
  
  async updateCustomerList(id: string, customerListData: Partial<CustomerList>): Promise<CustomerList> {
    const customerList = await db.CustomerList.findByPk(id);
    if (!customerList) throw new Error('CustomerList not found');
    return await customerList.update(customerListData);
  }
  
  async deleteCustomerList(id: string): Promise<void> {
    const customerList = await db.CustomerList.findByPk(id);
    if (customerList) {
      await customerList.destroy();
    }
  }
  
  // Customer methods
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    return await db.Customer.create({
      ...customerData,
      id: uuidv4()
    });
  }
  
  async createCustomersFromCSV(csvData: CsvCustomerData[], listId: string, userId: string): Promise<Customer[]> {
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Map CSV data to customer data
      const customerData = csvData.map(data => ({
        id: uuidv4(),
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        status: data.status || 'active',
        customerListId: listId,
        userId
      }));
      
      // Insert all customers
      const createdCustomers = await db.Customer.bulkCreate(customerData, { transaction }) as unknown as ExtendedCustomer[];
      
      // Auto-link to any campaigns associated with this customer list
      const customerList = await db.CustomerList.findByPk(listId, {
        include: [{ model: db.Campaign, as: 'campaigns' }],
        transaction
      }) as ExtendedCustomerList;
      
      // If there are campaigns associated with this list, link customers to those campaigns
      if (customerList && customerList.campaigns && customerList.campaigns.length > 0) {
        for (const customer of createdCustomers) {
          for (const campaign of customerList.campaigns) {
            await customer.addCampaign(campaign, { transaction });
          }
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      return createdCustomers;
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  }
  
  async getCustomers(userId: string): Promise<Customer[]> {
    return await db.Customer.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }
  
  async getCustomerById(id: string, userId: string): Promise<Customer | undefined> {
    const customer = await db.Customer.findOne({
      where: {
        id,
        userId
      }
    });
    return customer || undefined;
  }
  
  async getCustomersByListId(listId: string): Promise<Customer[]> {
    return await db.Customer.findAll({
      where: { customerListId: listId },
      order: [['createdAt', 'DESC']]
    });
  }
  
  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    const customer = await db.Customer.findByPk(id);
    if (!customer) throw new Error('Customer not found');
    return await customer.update(customerData);
  }
  
  async deleteCustomer(id: string): Promise<void> {
    const customer = await db.Customer.findByPk(id);
    if (customer) {
      await customer.destroy();
    }
  }
  
  // Campaign methods
  async createCampaign(campaignData: InsertCampaign, customerListIds: string[]): Promise<Campaign> {
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Create campaign
      const campaign = await db.Campaign.create({
        ...campaignData,
        id: uuidv4()
      }, { transaction }) as unknown as ExtendedCampaign;
      
      // Link campaign to customer lists
      if (customerListIds && customerListIds.length > 0) {
        const customerLists = await db.CustomerList.findAll({
          where: {
            id: { [Op.in]: customerListIds },
            userId: campaignData.userId
          },
          transaction
        });
        
        if (customerLists && customerLists.length > 0) {
          await campaign.addCustomerLists(customerLists, { transaction });
          
          // Get all customers from the selected customer lists
          const customers = await db.Customer.findAll({
            where: {
              customerListId: { [Op.in]: customerListIds },
              userId: campaignData.userId
            },
            transaction
          });
          
          // Link campaign to customers
          if (customers && customers.length > 0) {
            await campaign.addCustomers(customers, { transaction });
          }
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      return campaign;
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  }
  
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db.Campaign.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }
  
  async getCampaignById(id: string, userId: string): Promise<Campaign | undefined> {
    const campaign = await db.Campaign.findOne({
      where: {
        id,
        userId
      }
    });
    return campaign || undefined;
  }
  
  async updateCampaign(id: string, campaignData: Partial<Campaign>): Promise<Campaign> {
    const campaign = await db.Campaign.findByPk(id);
    if (!campaign) throw new Error('Campaign not found');
    return await campaign.update(campaignData);
  }
  
  async updateCampaignWithLists(id: string, campaignData: Partial<Campaign>, customerListIds: string[]): Promise<Campaign> {
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Update campaign
      const campaignModel = await db.Campaign.findByPk(id, { transaction });
      if (!campaignModel) {
        await transaction.rollback();
        throw new Error('Campaign not found');
      }
      
      await campaignModel.update(campaignData, { transaction });
      const campaign = campaignModel as unknown as ExtendedCampaign;
      
      // Update campaign-customer list relationships
      if (customerListIds && customerListIds.length > 0) {
        // Remove existing associations
        await campaign.setCustomerLists([], { transaction });
        
        // Get the customer lists
        const customerLists = await db.CustomerList.findAll({
          where: {
            id: { [Op.in]: customerListIds },
            userId: campaign.userId
          },
          transaction
        });
        
        if (customerLists && customerLists.length > 0) {
          // Add new associations
          await campaign.addCustomerLists(customerLists, { transaction });
          
          // Remove existing customer associations
          await campaign.setCustomers([], { transaction });
          
          // Get all customers from the selected customer lists
          const customers = await db.Customer.findAll({
            where: {
              customerListId: { [Op.in]: customerListIds },
              userId: campaign.userId
            },
            transaction
          });
          
          // Link campaign to customers
          if (customers && customers.length > 0) {
            await campaign.addCustomers(customers, { transaction });
          }
        }
      } else {
        // If no customer lists selected, remove all associations
        await campaign.setCustomerLists([], { transaction });
        await campaign.setCustomers([], { transaction });
      }
      
      // Commit the transaction
      await transaction.commit();
      
      // Fetch the updated campaign with its associations
      const updatedCampaignModel = await db.Campaign.findByPk(id, {
        include: [
          { model: db.CustomerList, as: 'customerLists' }
        ]
      });
      const updatedCampaign = updatedCampaignModel as unknown as ExtendedCampaign;
      
      return updatedCampaign;
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  }
  
  async deleteCampaign(id: string): Promise<void> {
    const campaign = await db.Campaign.findByPk(id);
    if (campaign) {
      await campaign.destroy();
    }
  }
  
  async getCustomerListsByCampaignId(campaignId: string): Promise<CustomerList[]> {
    const campaignModel = await db.Campaign.findByPk(campaignId, {
      include: [{ model: db.CustomerList, as: 'customerLists' }]
    });
    const campaign = campaignModel as unknown as ExtendedCampaign;
    
    return campaign ? campaign.customerLists || [] : [];
  }
  
  async getCustomersByCampaignId(campaignId: string): Promise<Customer[]> {
    const campaignModel = await db.Campaign.findByPk(campaignId, {
      include: [{ model: db.Customer, as: 'customers' }]
    });
    const campaign = campaignModel as unknown as ExtendedCampaign;
    
    return campaign ? campaign.customers || [] : [];
  }
  
  // Activity methods
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    return await db.Activity.create({
      ...activityData,
      id: uuidv4()
    });
  }
  
  async getRecentActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    return await db.Activity.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit
    });
  }
}

// Export a singleton instance of DatabaseStorage
export const storage = new DatabaseStorage();
