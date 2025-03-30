const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { db } = require('./models');
const { User, CustomerList, Customer, Campaign, Activity } = db;
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');

class DatabaseStorage {
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
  async getUserById(id) {
    return await User.findByPk(id);
  }
  
  async getUserByEmail(email) {
    return await User.findOne({
      where: { email }
    });
  }
  
  async createUser(userData) {
    return await User.create({
      ...userData,
      id: uuidv4()
    });
  }
  
  async updateUser(id, userData) {
    const user = await User.findByPk(id);
    if (!user) return null;
    
    return await user.update(userData);
  }
  
  // CustomerList methods
  async createCustomerList(customerListData) {
    return await CustomerList.create({
      ...customerListData,
      id: uuidv4()
    });
  }
  
  async getCustomerLists(userId) {
    return await CustomerList.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }
  
  async getCustomerListById(id, userId) {
    return await CustomerList.findOne({
      where: {
        id,
        userId
      }
    });
  }
  
  async updateCustomerList(id, customerListData) {
    const customerList = await CustomerList.findByPk(id);
    if (!customerList) return null;
    
    return await customerList.update(customerListData);
  }
  
  async deleteCustomerList(id) {
    const customerList = await CustomerList.findByPk(id);
    if (customerList) {
      await customerList.destroy();
    }
  }
  
  // Customer methods
  async createCustomer(customerData) {
    return await Customer.create({
      ...customerData,
      id: uuidv4()
    });
  }
  
  async createCustomersFromCSV(csvData, listId, userId) {
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
      const createdCustomers = await Customer.bulkCreate(customerData, { transaction });
      
      // Auto-link to any campaigns associated with this customer list
      const customerList = await CustomerList.findByPk(listId, {
        include: [{ model: Campaign, as: 'campaigns' }],
        transaction
      });
      
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
  
  async getCustomers(userId) {
    return await Customer.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }
  
  async getCustomerById(id, userId) {
    return await Customer.findOne({
      where: {
        id,
        userId
      }
    });
  }
  
  async getCustomersByListId(listId) {
    return await Customer.findAll({
      where: { customerListId: listId },
      order: [['createdAt', 'DESC']]
    });
  }
  
  async updateCustomer(id, customerData) {
    const customer = await Customer.findByPk(id);
    if (!customer) return null;
    
    return await customer.update(customerData);
  }
  
  async deleteCustomer(id) {
    const customer = await Customer.findByPk(id);
    if (customer) {
      await customer.destroy();
    }
  }
  
  // Campaign methods
  async createCampaign(campaignData, customerListIds) {
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Create campaign
      const campaign = await Campaign.create({
        ...campaignData,
        id: uuidv4()
      }, { transaction });
      
      // Link campaign to customer lists
      if (customerListIds && customerListIds.length > 0) {
        const customerLists = await CustomerList.findAll({
          where: {
            id: { [Op.in]: customerListIds },
            userId: campaignData.userId
          },
          transaction
        });
        
        if (customerLists && customerLists.length > 0) {
          await campaign.addCustomerLists(customerLists, { transaction });
          
          // Get all customers from the selected customer lists
          const customers = await Customer.findAll({
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
  
  async getCampaigns(userId) {
    return await Campaign.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }
  
  async getCampaignById(id, userId) {
    return await Campaign.findOne({
      where: {
        id,
        userId
      }
    });
  }
  
  async updateCampaign(id, campaignData) {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return null;
    
    return await campaign.update(campaignData);
  }
  
  async updateCampaignWithLists(id, campaignData, customerListIds) {
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Update campaign
      const campaign = await Campaign.findByPk(id, { transaction });
      if (!campaign) {
        await transaction.rollback();
        return null;
      }
      
      await campaign.update(campaignData, { transaction });
      
      // Update campaign-customer list relationships
      if (customerListIds && customerListIds.length > 0) {
        // Remove existing associations
        await campaign.setCustomerLists([], { transaction });
        
        // Get the customer lists
        const customerLists = await CustomerList.findAll({
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
          const customers = await Customer.findAll({
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
      return await Campaign.findByPk(id, {
        include: [
          { model: CustomerList, as: 'customerLists' }
        ]
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  }
  
  async deleteCampaign(id) {
    const campaign = await Campaign.findByPk(id);
    if (campaign) {
      await campaign.destroy();
    }
  }
  
  async getCustomerListsByCampaignId(campaignId) {
    const campaign = await Campaign.findByPk(campaignId, {
      include: [{ model: CustomerList, as: 'customerLists' }]
    });
    
    return campaign ? campaign.customerLists : [];
  }
  
  async getCustomersByCampaignId(campaignId) {
    const campaign = await Campaign.findByPk(campaignId, {
      include: [{ model: Customer, as: 'customers' }]
    });
    
    return campaign ? campaign.customers : [];
  }
  
  // Activity methods
  async createActivity(activityData) {
    return await Activity.create({
      ...activityData,
      id: uuidv4()
    });
  }
  
  async getRecentActivities(userId, limit = 10) {
    return await Activity.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit
    });
  }
}

const storage = new DatabaseStorage();

module.exports = {
  storage,
  DatabaseStorage
};