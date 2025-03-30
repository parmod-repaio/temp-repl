#!/bin/bash

#########################################################
# Enhanced Sequelize Migration Runner
#
# This script provides a dual-method approach to running 
# database migrations with TypeScript support:
#
# 1. First tries using the standard Sequelize CLI
# 2. If that fails, falls back to our custom TypeScript
#    migration runner for direct execution
#
# Usage: ./run-migrations.sh
#########################################################

echo "🔄 Starting database migration process..."
echo "📂 Using TypeScript configuration from sequelizerc.ts"

# Option 1: Try the standard Sequelize CLI approach first
echo "🔍 Attempt 1: Using Sequelize CLI..."
npx sequelize-cli db:migrate

# Store the migration status
MIGRATION_STATUS=$?

# Show completion status
if [ $MIGRATION_STATUS -eq 0 ]; then
  echo "✅ Migrations completed successfully via Sequelize CLI!"
else
  echo "⚠️  Sequelize CLI approach failed with exit code: $MIGRATION_STATUS"
  echo "   This is expected if you're using TypeScript-only configuration"
  
  # Option 2: Fallback to our custom migration runner if CLI fails
  echo "🔍 Attempt 2: Using custom TypeScript migration runner..."
  npx tsx migration-runner.ts
  
  # Update migration status
  MIGRATION_STATUS=$?
  
  if [ $MIGRATION_STATUS -eq 0 ]; then
    echo "✅ Migrations completed successfully via custom TypeScript runner!"
  else
    echo "❌ ERROR: Both migration methods failed. Please check errors above."
    echo "   This indicates a critical issue with your database configuration."
  fi
fi

# Exit with the final migration status
exit $MIGRATION_STATUS