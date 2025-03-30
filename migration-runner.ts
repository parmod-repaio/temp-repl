/**
 * TypeScript Migration Runner
 * 
 * This script provides an alternative approach to running Sequelize migrations:
 * - Directly uses the Sequelize API instead of the CLI
 * - Handles TypeScript migrations natively without compilation
 * - Provides detailed error reporting and better control over the migration process
 * 
 * Usage:
 *   npx tsx migration-runner.ts
 * 
 * Note: This is provided as a fallback to the primary migration approach:
 *   npx sequelize-cli db:migrate
 * 
 * The run-migrations.sh script will automatically attempt this method if the 
 * standard CLI method fails for any reason.
 */

import { Sequelize } from 'sequelize';
import { QueryInterface } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSequelizeInstance } from './sequelizerc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Sequelize using our TypeScript configuration
const sequelize = createSequelizeInstance();

async function runMigrations() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Get the QueryInterface
    const queryInterface: QueryInterface = sequelize.getQueryInterface();

    // Migration directory
    const migrationsDir = path.join(__dirname, 'server', 'migrations');
    
    // Get all migration files (sorted by name)
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files to run.`);

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      
      // Import the migration module
      const migrationPath = path.join(migrationsDir, file);
      
      // Use dynamic import to load the migration
      const migration = await import(migrationPath);
      
      try {
        // Run the up function
        await migration.up(queryInterface, Sequelize);
        console.log(`✅ Migration ${file} applied successfully`);
      } catch (error: any) {
        // Handle errors (check if it's because the table already exists)
        if (error.message.includes('already exists')) {
          console.log(`Table already exists, skipping ${file}`);
        } else {
          console.error(`❌ Error running migration ${file}:`, error.message);
          process.exit(1);
        }
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error: any) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();