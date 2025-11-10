#!/bin/bash

# Backup Remote Supabase Database
# Creates a SQL dump of your remote database before migrations
#
# Usage:
#   ./supabase/scripts/backup-remote.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Backup Remote Supabase Database    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
elif [ -f .env ]; then
    set -a
    source .env
    set +a
elif [ -f supabase/.env ]; then
    set -a
    source supabase/.env
    set +a
fi

# Build DATABASE_URL if not set
if [ -z "$DATABASE_URL" ] && [ -n "$VITE_SUPABASE_URL" ] && [ -n "$SUPABASE_DB_PASSWORD" ]; then
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's/https:\/\/([^.]+).*/\1/')
    DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    echo -e "${BLUE}💡 Using constructed DATABASE_URL${NC}"
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not configured${NC}"
    echo ""
    echo "Please set DATABASE_URL in your .env file or provide:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - SUPABASE_DB_PASSWORD"
    echo ""
    exit 1
fi

# Check for pg_dump
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ Error: pg_dump not found${NC}"
    echo ""
    echo "Please install PostgreSQL client tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Creating backup...${NC}"
echo -e "${BLUE}   Backup file: ${BACKUP_FILE}${NC}"
echo ""

# Create backup (schema + data for public schema only)
if pg_dump "$DATABASE_URL" \
    --schema=public \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --file="$BACKUP_FILE"; then

    # Get file size
    if [[ "$OSTYPE" == "darwin"* ]]; then
        FILE_SIZE=$(stat -f%z "$BACKUP_FILE")
    else
        FILE_SIZE=$(stat -c%s "$BACKUP_FILE")
    fi
    FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE/1048576" | bc)

    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo ""
    echo -e "${GREEN}📄 File: $BACKUP_FILE${NC}"
    echo -e "${GREEN}📦 Size: ${FILE_SIZE_MB} MB${NC}"
    echo ""
    echo -e "${BLUE}To restore this backup later, run:${NC}"
    echo -e "${YELLOW}  psql \"\$DATABASE_URL\" -f $BACKUP_FILE${NC}"
    echo ""
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Clean up old backups (keep last 10)
echo -e "${BLUE}🧹 Cleaning up old backups (keeping last 10)...${NC}"
cd "$BACKUP_DIR"
ls -t backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm --
REMAINING=$(ls -1 backup_*.sql 2>/dev/null | wc -l)
echo -e "${GREEN}   Kept ${REMAINING} backup(s)${NC}"
echo ""

echo -e "${GREEN}✅ Done!${NC}"
