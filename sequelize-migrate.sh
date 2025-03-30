#!/bin/bash

#########################################################
# Sequelize Migration Helper
#
# This script handles database migrations with Sequelize
# using our TypeScript codebase.
#
# Usage: 
#   ./sequelize-migrate.sh [command]
#
# Commands:
#   migrate     - Run pending migrations
#   rollback    - Undo the most recent migration
#   status      - Show migration status
#   create      - Create a new migration (requires name)
#                 e.g., ./sequelize-migrate.sh create add-user-role
#
# Examples:
#   ./sequelize-migrate.sh migrate
#   ./sequelize-migrate.sh rollback
#   ./sequelize-migrate.sh create add-new-field
#########################################################

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Display usage information
function show_usage {
  echo -e "${YELLOW}Sequelize Migration Helper${NC}"
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Commands:"
  echo "  migrate             Run pending migrations"
  echo "  rollback            Undo the most recent migration"
  echo "  status              Show migration status"
  echo "  create [name]       Create a new migration file"
  echo ""
  echo "Examples:"
  echo "  $0 migrate"
  echo "  $0 create add-user-role"
}

# Check for command argument
if [ $# -lt 1 ]; then
  show_usage
  exit 1
fi

# Process commands
case "$1" in
  migrate)
    echo -e "${YELLOW}Running migrations...${NC}"
    ./run-migrations.sh
    ;;

  rollback)
    echo -e "${YELLOW}Rolling back the most recent migration...${NC}"
    npx sequelize-cli db:migrate:undo
    ;;

  status)
    echo -e "${YELLOW}Checking migration status...${NC}"
    npx sequelize-cli db:migrate:status
    ;;

  create)
    if [ $# -lt 2 ]; then
      echo -e "${RED}Error: Migration name is required${NC}"
      echo "Example: $0 create add-user-role"
      exit 1
    fi
    
    # Create migration with the provided name
    MIGRATION_NAME=$2
    echo -e "${YELLOW}Creating migration: ${MIGRATION_NAME}${NC}"
    npx sequelize-cli migration:generate --name $MIGRATION_NAME
    
    # Provide guidance on editing the new migration
    echo -e "${GREEN}Migration created!${NC}"
    echo "Remember to edit the new migration file to add your changes."
    echo -e "Use TypeScript syntax and the ${YELLOW}QueryInterface${NC} for database operations."
    ;;

  help|--help|-h)
    show_usage
    ;;

  *)
    echo -e "${RED}Unknown command: $1${NC}"
    show_usage
    exit 1
    ;;
esac