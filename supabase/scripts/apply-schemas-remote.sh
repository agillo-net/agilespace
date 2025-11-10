#!/bin/bash

# Apply Schemas to Remote Database
# This script works with remote Supabase databases using DATABASE_URL
#
# Usage:
#   ./supabase/scripts/apply-schemas-remote.sh              # Apply all
#   ./supabase/scripts/apply-schemas-remote.sh 06 07        # Apply specific

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMAS_DIR="$SCRIPT_DIR/../schemas"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Apply Schemas to Remote Database   ║${NC}"
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

# Determine which schemas to apply
if [ $# -eq 0 ]; then
    SCHEMA_FILES=("$SCHEMAS_DIR"/*.sql)
else
    SCHEMA_FILES=()
    for num in "$@"; do
        found_files=("$SCHEMAS_DIR"/${num}_*.sql)
        if [ -e "${found_files[0]}" ]; then
            SCHEMA_FILES+=("${found_files[@]}")
        else
            echo -e "${RED}❌ Error: No schema file found with number ${num}${NC}"
            exit 1
        fi
    done
fi

# Sort schema files
IFS=$'\n' SCHEMA_FILES=($(sort <<<"${SCHEMA_FILES[*]}"))
unset IFS

echo -e "${GREEN}📦 Found ${#SCHEMA_FILES[@]} schema file(s) to apply:${NC}"
for file in "${SCHEMA_FILES[@]}"; do
    echo "   - $(basename "$file")"
done
echo ""

echo -e "${BLUE}Applying schemas using psql...${NC}"
echo ""

success_count=0
error_count=0

for schema_file in "${SCHEMA_FILES[@]}"; do
    filename=$(basename "$schema_file")
    echo -e "${BLUE}📄 Applying: ${filename}${NC}"

    if psql "$DATABASE_URL" -f "$schema_file" -q; then
        echo -e "${GREEN}   ✅ Successfully applied${NC}"
        ((success_count++))
    else
        echo -e "${RED}   ❌ Failed to apply${NC}"
        ((error_count++))
    fi
    echo ""
done

echo -e "${GREEN}✅ Applied ${success_count} schema(s) successfully${NC}"
if [ $error_count -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ${error_count} schema(s) had errors${NC}"
fi
