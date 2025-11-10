#!/bin/bash

# Seed Database Script
# Seeds the database with sample data for development
#
# Usage:
#   ./supabase/scripts/seed-data.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Supabase Seed Data Script          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Sample seed data SQL
SEED_SQL="
-- =====================================================
-- SEED DATA FOR DEVELOPMENT
-- =====================================================

-- Note: This assumes you have at least one user already signed up via GitHub OAuth
-- Replace the user_id values with actual user IDs from your auth.users table

-- Sample Space
INSERT INTO spaces (id, name, slug, avatar_url, plan)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo Space', 'demo-space', null, 'free')
ON CONFLICT (id) DO NOTHING;

-- Sample Tags
INSERT INTO tags (space_id, name, color)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bug', '#ef4444'),
  ('11111111-1111-1111-1111-111111111111', 'Feature', '#3b82f6'),
  ('11111111-1111-1111-1111-111111111111', 'Refactor', '#8b5cf6'),
  ('11111111-1111-1111-1111-111111111111', 'Documentation', '#10b981')
ON CONFLICT DO NOTHING;

-- Note: To add yourself as a space member, you need to know your user ID
-- You can find it by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- Then uncomment and update the following:

-- INSERT INTO space_members (space_id, user_id, role)
-- VALUES
--   ('11111111-1111-1111-1111-111111111111', 'your-user-id-here', 'admin')
-- ON CONFLICT DO NOTHING;

SELECT 'Seed data applied successfully!' as status;
"

echo -e "${BLUE}🌱 Seeding database with sample data...${NC}"
echo ""

# Try Supabase CLI with psql
if command -v supabase &> /dev/null && command -v psql &> /dev/null && supabase status &> /dev/null; then
    echo -e "${GREEN}✓ Using Supabase CLI (local)${NC}"

    # Get connection string (remove quotes)
    DB_URL=$(supabase status -o env | grep "DB_URL=" | cut -d= -f2- | tr -d '"')

    if [ -n "$DB_URL" ]; then
        if echo "$SEED_SQL" | psql "$DB_URL" 2>/dev/null; then
            echo ""
            echo -e "${GREEN}✅ Seed data applied successfully!${NC}"
            exit 0
        fi
    fi
fi

# Try DATABASE_URL with psql
if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ Using DATABASE_URL with psql${NC}"

    if echo "$SEED_SQL" | psql "$DATABASE_URL"; then
        echo ""
        echo -e "${GREEN}✅ Seed data applied successfully!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Failed to seed database${NC}"
        exit 1
    fi
fi

# Manual instructions
echo -e "${YELLOW}Please run the following SQL manually in Supabase SQL Editor:${NC}"
echo ""
echo "----------------------------------------"
echo "$SEED_SQL"
echo "----------------------------------------"
echo ""

exit 1
