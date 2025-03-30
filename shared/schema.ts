import { z } from "zod";

// Define Zod schemas for all models

// User schema
export const insertUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Customer List schema
export const insertCustomerListSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  description: z.string().optional(),
  userId: z.string().uuid("Invalid user ID"),
});

// Customer schema
export const insertCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  status: z.string().default('active'),
  customerListId: z.string().uuid("Invalid customer list ID"),
  userId: z.string().uuid("Invalid user ID"),
});

// Campaign schema
export const insertCampaignSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  description: z.string().optional(),
  status: z.string().default('inactive'),
  userId: z.string().uuid("Invalid user ID"),
});

// Campaign Customer List schema
export const insertCampaignCustomerListSchema = z.object({
  campaignId: z.string().uuid("Invalid campaign ID"),
  customerListId: z.string().uuid("Invalid customer list ID"),
});

// Campaign Customer schema
export const insertCampaignCustomerSchema = z.object({
  campaignId: z.string().uuid("Invalid campaign ID"),
  customerId: z.string().uuid("Invalid customer ID"),
});

// Activity schema
export const insertActivitySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().optional(),
  userId: z.string().uuid("Invalid user ID"),
});

// Define TypeScript interfaces for database models
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerList {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  status: string;
  customerListId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignCustomerList {
  campaignId: string;
  customerListId: string;
}

export interface CampaignCustomer {
  campaignId: string;
  customerId: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: Date;
}

// Define types for insertion
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomerList = z.infer<typeof insertCustomerListSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertCampaignCustomerList = z.infer<typeof insertCampaignCustomerListSchema>;
export type InsertCampaignCustomer = z.infer<typeof insertCampaignCustomerSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;

// Update user profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).optional(),
  confirmPassword: z.string().min(6).optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

// CSV import schema for customer data
export const csvCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  status: z.string().optional().default('active'),
});

export type CsvCustomerData = z.infer<typeof csvCustomerSchema>;
