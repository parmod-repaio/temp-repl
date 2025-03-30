import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
// Import routes
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import customerListRoutes from "./routes/customerLists";
import customerRoutes from "./routes/customers";
import campaignRoutes from "./routes/campaigns";
import dashboardRoutes from "./routes/dashboard";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/customer-lists', customerListRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
