#!/bin/bash

# Reset Database Script
# WARNING: This will delete all data in your database!
#
# Usage:
#   ./supabase/scripts/reset-db.sh           # Interactive confirmation
#   ./supabase/scripts/reset-db.sh --force   # Skip confirmation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
echo -e "${RED}║   Supabase Database Reset Script     ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check for --force flag
if [[ "$1" != "--force" ]]; then
    echo -e "${RED}⚠️  WARNING: This will DELETE ALL DATA in your database!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        echo -e "${YELLOW}❌ Reset cancelled${NC}"
        exit 0
    fi
fi

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo ""
echo -e "${BLUE}🔄 Starting database reset...${NC}"
echo ""

# SQL to drop all tables
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
"

# Try psql with connection string from Supabase CLI
if command -v supabase &> /dev/null && supabase status &> /dev/null; then
    echo -e "${GREEN}✓ Using Supabase CLI (local)${NC}"
    echo ""

    # For local Supabase, use supabase db reset
    echo -e "${BLUE}📋 Resetting local database...${NC}"
    if supabase db reset; then
        echo ""
        echo -e "${GREEN}✅ Database reset complete!${NC}"
        echo -e "${BLUE}💡 Run 'pnpm db:apply' to apply schemas${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Local reset failed, trying direct SQL approach...${NC}"
    fi

    # Try to get connection string and use psql
    if command -v psql &> /dev/null; then
        # Get the connection string from supabase status (remove quotes)
        DB_URL=$(supabase status -o env | grep "DB_URL=" | cut -d= -f2- | tr -d '"')

        if [ -n "$DB_URL" ]; then
            echo -e "${BLUE}📋 Dropping tables and functions...${NC}"
            if echo "$RESET_SQL" | psql "$DB_URL" 2>/dev/null; then
                echo ""
                echo -e "${GREEN}✅ Database reset complete!${NC}"
                echo -e "${BLUE}💡 Run 'pnpm db:apply' to apply schemas${NC}"
                exit 0
            fi
        fi
    fi
fi

# Try DATABASE_URL with psql
if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ Using DATABASE_URL with psql${NC}"
    echo ""

    echo -e "${BLUE}📋 Dropping tables and functions...${NC}"
    if echo "$RESET_SQL" | psql "$DATABASE_URL"; then
        echo ""
        echo -e "${GREEN}✅ Database reset complete!${NC}"
        echo -e "${BLUE}💡 Run 'pnpm db:apply' to apply schemas${NC}"
        exit 0
    else
        echo -e "${RED}❌ Failed to reset database${NC}"
        exit 1
    fi
fi

# Manual instructions
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Manual Database Reset Required                  ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Neither Supabase CLI nor DATABASE_URL is configured.${NC}"
echo ""
echo "Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "----------------------------------------"
echo "$RESET_SQL"
echo "----------------------------------------"
echo ""
echo -e "${BLUE}OR set up one of the following:${NC}"
echo ""
echo "Option 1: Install Supabase CLI"
echo "  npm install -g supabase"
echo "  supabase link --project-ref your-project-ref"
echo ""
echo "Option 2: Set DATABASE_URL in .env"
echo "  DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"
echo ""

exit 1
