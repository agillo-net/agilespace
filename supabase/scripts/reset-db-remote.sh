#!/bin/bash

# Reset Remote Database Script
# This script works with remote Supabase databases using DATABASE_URL
#
# Usage:
#   ./supabase/scripts/reset-db-remote.sh           # Interactive
#   ./supabase/scripts/reset-db-remote.sh --force   # Skip confirmation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
echo -e "${RED}║   Reset Remote Supabase Database     ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
elif [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Build DATABASE_URL if not set
if [ -z "$DATABASE_URL" ] && [ -n "$VITE_SUPABASE_URL" ] && [ -n "$SUPABASE_DB_PASSWORD" ]; then
    # Extract project ref from URL
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's/https:\/\/([^.]+).*/\1/')
    DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    echo -e "${BLUE}💡 Using constructed DATABASE_URL${NC}"
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not configured${NC}"
    echo ""
    echo "Please set DATABASE_URL in your .env file:"
    echo ""
    echo "Get it from: Supabase Dashboard → Settings → Database → Connection String"
    echo "Select 'Transaction' mode and copy the URI"
    echo ""
    echo "Add to .env:"
    echo "DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
    echo ""
    exit 1
fi

# Check for psql
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql not found${NC}"
    echo ""
    echo "Please install PostgreSQL client tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

# Confirmation
if [[ "$1" != "--force" ]]; then
    echo -e "${RED}⚠️  WARNING: This will DELETE ALL DATA in your remote database!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        echo -e "${YELLOW}❌ Reset cancelled${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}🔄 Resetting remote database...${NC}"
echo ""

# Reset SQL
RESET_SQL="
-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS session_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS space_member_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS space_members CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS user_has_permission(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS get_user_permissions(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS create_space_with_admin(text, text, text, bigint) CASCADE;

SELECT 'Database reset complete!' as status;
"

echo -e "${BLUE}📋 Dropping tables and functions...${NC}"

if echo "$RESET_SQL" | psql "$DATABASE_URL"; then
    echo ""
    echo -e "${GREEN}✅ Database reset complete!${NC}"
    echo -e "${BLUE}💡 Run 'pnpm db:apply' to apply schemas${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Failed to reset database${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check DATABASE_URL is correct"
    echo "2. Verify network connectivity"
    echo "3. Ensure password is correct"
    echo "4. Check Supabase project is not paused"
    echo ""
    exit 1
fi
