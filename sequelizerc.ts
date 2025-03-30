/**
 * Sequelize Configuration Module (TypeScript)
 * 
 * This file serves multiple purposes:
 * 1. Provides configuration for the Sequelize CLI through .sequelizerc
 * 2. Exports a helper function to create Sequelize instances throughout the app
 * 3. Centralizes database configuration in one TypeScript file
 * 
 * The application has been fully migrated from .mjs/.cjs files to TypeScript.
 * Sequelize CLI uses this configuration through the .sequelizerc file.
 */

import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration object for Sequelize CLI and programmatic usage
export const sequelizeConfig = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres' as const,
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres' as const,
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

// Helper function to create a Sequelize instance based on environment
export function createSequelizeInstance(): Sequelize {
  const env = process.env.NODE_ENV || 'development';
  const config = sequelizeConfig[env as keyof typeof sequelizeConfig];
  const databaseUrl = process.env[config.use_env_variable];
  
  if (!databaseUrl) {
    throw new Error(`Environment variable ${config.use_env_variable} is required`);
  }
  
  return new Sequelize(databaseUrl, {
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: console.log
  });
}

export default sequelizeConfig;