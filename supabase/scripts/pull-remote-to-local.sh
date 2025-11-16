#!/bin/bash

# Pull Remote Database to Local
# Downloads remote Supabase database and restores it to local instance
#
# Usage:
#   ./supabase/scripts/pull-remote-to-local.sh [--skip-backup]
#
# Options:
#   --skip-backup    Skip creating a backup of local database before restore

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REMOTE_BACKUP="$BACKUP_DIR/remote_${TIMESTAMP}.sql"
LOCAL_BACKUP="$BACKUP_DIR/local_${TIMESTAMP}.sql"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
SKIP_LOCAL_BACKUP=false
for arg in "$@"; do
    case $arg in
        --skip-backup)
            SKIP_LOCAL_BACKUP=true
            shift
            ;;
    esac
done

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Pull Remote Database to Local       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
    echo -e "${BLUE}📝 Loaded .env.local${NC}"
elif [ -f .env ]; then
    set -a
    source .env
    set +a
    echo -e "${BLUE}📝 Loaded .env${NC}"
elif [ -f supabase/.env ]; then
    set -a
    source supabase/.env
    set +a
    echo -e "${BLUE}📝 Loaded supabase/.env${NC}"
fi
echo ""

# Build DATABASE_URL if not set
if [ -z "$DATABASE_URL" ] && [ -n "$VITE_SUPABASE_URL" ] && [ -n "$SUPABASE_DB_PASSWORD" ]; then
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's/https:\/\/([^.]+).*/\1/')
    DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    echo -e "${BLUE}💡 Using constructed DATABASE_URL${NC}"
    echo ""
fi

# Validate required tools
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ Error: pg_dump not found${NC}"
    echo ""
    echo "Please install PostgreSQL client tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql not found${NC}"
    echo ""
    echo "Please install PostgreSQL client tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

# Check if local Supabase is running
if ! supabase status &> /dev/null; then
    echo -e "${RED}❌ Error: Local Supabase is not running${NC}"
    echo ""
    echo "Please start Supabase with:"
    echo -e "${YELLOW}  supabase start${NC}"
    echo ""
    exit 1
fi

# Get local database connection string
LOCAL_DB_URL=$(supabase status | grep "Database URL" | awk '{print $3}')
if [ -z "$LOCAL_DB_URL" ]; then
    echo -e "${RED}❌ Error: Could not get local database URL${NC}"
    exit 1
fi

# Check for remote DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not configured${NC}"
    echo ""
    echo "Please set DATABASE_URL in your .env file or provide:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - SUPABASE_DB_PASSWORD"
    echo ""
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Step 1: Backup local database (optional)
if [ "$SKIP_LOCAL_BACKUP" = false ]; then
    echo -e "${YELLOW}📦 Step 1/5: Backing up local database...${NC}"
    echo -e "${BLUE}   File: ${LOCAL_BACKUP}${NC}"
    echo ""

    if pg_dump "$LOCAL_DB_URL" \
        --schema=public \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --file="$LOCAL_BACKUP"; then

        if [[ "$OSTYPE" == "darwin"* ]]; then
            FILE_SIZE=$(stat -f%z "$LOCAL_BACKUP")
        else
            FILE_SIZE=$(stat -c%s "$LOCAL_BACKUP")
        fi
        FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE/1048576" | bc)

        echo -e "${GREEN}✅ Local backup created (${FILE_SIZE_MB} MB)${NC}"
        echo ""
    else
        echo -e "${RED}❌ Local backup failed!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Step 1/5: Skipping local backup${NC}"
    echo ""
fi

# Step 2: Download remote database
echo -e "${YELLOW}📥 Step 2/5: Downloading remote database...${NC}"
echo -e "${BLUE}   File: ${REMOTE_BACKUP}${NC}"
echo ""

if pg_dump "$DATABASE_URL" \
    --schema=public \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --file="$REMOTE_BACKUP"; then

    if [[ "$OSTYPE" == "darwin"* ]]; then
        FILE_SIZE=$(stat -f%z "$REMOTE_BACKUP")
    else
        FILE_SIZE=$(stat -c%s "$REMOTE_BACKUP")
    fi
    FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE/1048576" | bc)

    echo -e "${GREEN}✅ Remote database downloaded (${FILE_SIZE_MB} MB)${NC}"
    echo ""
else
    echo -e "${RED}❌ Download failed!${NC}"
    exit 1
fi

# Step 3: Clear local database
echo -e "${YELLOW}🗑️  Step 3/5: Clearing local database...${NC}"
echo ""

# Drop all tables in public schema
psql "$LOCAL_DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" &> /dev/null

echo -e "${GREEN}✅ Local database cleared${NC}"
echo ""

# Step 4: Restore to local
echo -e "${YELLOW}📤 Step 4/5: Restoring to local database...${NC}"
echo ""

if psql "$LOCAL_DB_URL" -f "$REMOTE_BACKUP" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
    echo ""
else
    echo -e "${RED}❌ Restore failed!${NC}"
    echo ""
    if [ "$SKIP_LOCAL_BACKUP" = false ]; then
        echo -e "${YELLOW}💡 Your local backup is available at:${NC}"
        echo -e "${YELLOW}   ${LOCAL_BACKUP}${NC}"
        echo ""
        echo -e "${YELLOW}To restore it, run:${NC}"
        echo -e "${YELLOW}   psql \"${LOCAL_DB_URL}\" -f ${LOCAL_BACKUP}${NC}"
        echo ""
    fi
    exit 1
fi

# Step 5: Fix permissions
echo -e "${YELLOW}🔐 Fixing schema permissions...${NC}"
echo ""

psql "$LOCAL_DB_URL" << 'EOF' > /dev/null 2>&1
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
EOF

echo -e "${GREEN}✅ Permissions fixed${NC}"
echo ""

# Step 6: Sync local user with spaces
echo -e "${YELLOW}👤 Syncing your user with spaces...${NC}"
echo ""

# Check if sync script exists
if [ -f "$SCRIPT_DIR/sync-local-user.sh" ]; then
    # Run sync script silently
    if "$SCRIPT_DIR/sync-local-user.sh" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ User synced with all spaces${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not sync user automatically${NC}"
        echo -e "${YELLOW}   Run manually: ./supabase/scripts/sync-local-user.sh${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  sync-local-user.sh not found, skipping user sync${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Summary                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""
if [ "$SKIP_LOCAL_BACKUP" = false ]; then
    echo -e "${GREEN}📦 Local backup:  ${LOCAL_BACKUP}${NC}"
fi
echo -e "${GREEN}📦 Remote backup: ${REMOTE_BACKUP}${NC}"
echo ""
echo -e "${GREEN}✅ Your local database now has real production data!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember: This is production data. Handle with care!${NC}"
echo ""

# Clean up old backups (keep last 10 of each type)
echo -e "${BLUE}🧹 Cleaning up old backups (keeping last 10 of each type)...${NC}"
cd "$BACKUP_DIR"
ls -t remote_*.sql 2>/dev/null | tail -n +11 | xargs -I {} rm -- {} 2>/dev/null || true
ls -t local_*.sql 2>/dev/null | tail -n +11 | xargs -I {} rm -- {} 2>/dev/null || true
REMOTE_COUNT=$(ls -1 remote_*.sql 2>/dev/null | wc -l)
LOCAL_COUNT=$(ls -1 local_*.sql 2>/dev/null | wc -l)
echo -e "${GREEN}   Kept ${REMOTE_COUNT} remote backup(s) and ${LOCAL_COUNT} local backup(s)${NC}"
echo ""

echo -e "${GREEN}✅ Done!${NC}"
