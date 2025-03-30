# Database Migrations Guide

This project uses Sequelize ORM with TypeScript for database management. This guide explains how to work with database migrations.

## Migration Approaches

We support two approaches for running migrations:

1. **Standard Sequelize CLI** - Uses the standard Sequelize command-line interface
2. **TypeScript Migration Runner** - Our custom TypeScript-based migration runner that doesn't require compilation

## Running Migrations

We provide a convenience script `sequelize-migrate.sh` to handle common migration tasks.

### Basic Commands

- **Run Migrations**: Apply all pending migrations
  ```bash
  ./sequelize-migrate.sh migrate
  ```

- **Rollback Migration**: Undo the most recent migration
  ```bash
  ./sequelize-migrate.sh rollback
  ```

- **Check Status**: See which migrations are pending
  ```bash
  ./sequelize-migrate.sh status
  ```

- **Create Migration**: Generate a new migration file
  ```bash
  ./sequelize-migrate.sh create add-new-field
  ```

## How Migrations Work

When you run `./sequelize-migrate.sh migrate`, the following happens:

1. First, it attempts to use the standard Sequelize CLI
2. If that fails (common with TypeScript-only setups), it automatically falls back to our custom TypeScript migration runner
3. The custom runner directly executes your TypeScript migration files

## Migration File Structure

Migration files are located in `server/migrations/` and follow the format:

```typescript
import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface, Sequelize: any): Promise<void> {
  // Code to migrate up (create tables, add columns, etc.)
  await queryInterface.createTable('example', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface: QueryInterface, Sequelize: any): Promise<void> {
  // Code to migrate down (drop tables, remove columns, etc.)
  await queryInterface.dropTable('example');
}
```

## Creating New Models

When adding a new model to the application:

1. Create a model file in `server/models/`
2. Create a migration file for the database schema
3. Ensure the model is properly exported and initialized
4. Update `storage.ts` to include new CRUD operations for the model
5. Run migrations to create the database table

## Troubleshooting

- If you encounter issues with TypeScript migrations, check the error logs from `run-migrations.sh`
- Ensure all migration files export both `up` and `down` functions
- Verify that your models match the database schema

For more details on Sequelize migrations, see the [official Sequelize documentation](https://sequelize.org/docs/v6/other-topics/migrations/).