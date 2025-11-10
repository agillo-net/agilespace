#!/bin/bash

# Apply Database Schemas Script
# This script applies all schema files in order to your Supabase database.
#
# Usage:
#   ./supabase/scripts/apply-schemas.sh              # Apply all schemas
#   ./supabase/scripts/apply-schemas.sh 06 07        # Apply specific schemas
#   ./supabase/scripts/apply-schemas.sh --help       # Show help

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMAS_DIR="$SCRIPT_DIR/../schemas"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help message
show_help() {
    echo "╔═══════════════════════════════════════╗"
    echo "║   Supabase Schema Application         ║"
    echo "╚═══════════════════════════════════════╝"
    echo ""
    echo "Usage:"
    echo "  pnpm db:apply              # Apply all schemas"
    echo "  pnpm db:apply 06 07        # Apply specific schemas by number"
    echo "  pnpm db:apply --help       # Show this help"
    echo ""
    echo "Requirements:"
    echo "  1. Supabase CLI installed (recommended)"
    echo "     OR"
    echo "  2. PostgreSQL connection string in .env"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL               # Full PostgreSQL connection string"
    echo "  VITE_SUPABASE_URL         # Supabase project URL"
    echo "  SUPABASE_SERVICE_KEY      # Supabase service role key"
    echo ""
    exit 0
}

# Check if help is requested
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
fi

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Supabase Schema Application         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Determine which schemas to apply
if [ $# -eq 0 ]; then
    # Apply all schemas
    SCHEMA_FILES=("$SCHEMAS_DIR"/*.sql)
else
    # Apply specific schemas
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

# Check for Supabase CLI with psql
if command -v supabase &> /dev/null && command -v psql &> /dev/null; then
    # Check if supabase is running locally
    if supabase status &> /dev/null; then
        echo -e "${GREEN}✓ Using Supabase CLI (local)${NC}"
        echo ""

        # Get connection string from supabase (remove quotes)
        DB_URL=$(supabase status -o env | grep "DB_URL=" | cut -d= -f2- | tr -d '"')

        if [ -n "$DB_URL" ]; then
            echo -e "${BLUE}Applying schemas using psql...${NC}"
            echo ""

            for schema_file in "${SCHEMA_FILES[@]}"; do
                filename=$(basename "$schema_file")
                echo -e "${BLUE}📄 Applying: ${filename}${NC}"

                if psql "$DB_URL" -f "$schema_file" 2>&1 | grep -v "NOTICE"; then
                    echo -e "${GREEN}   ✅ Successfully applied${NC}"
                else
                    echo -e "${YELLOW}   ⚠️  Applied with warnings (may be okay)${NC}"
                fi
                echo ""
            done

            echo -e "${GREEN}✅ Schema application complete!${NC}"
            exit 0
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase is not running locally${NC}"
        echo -e "${YELLOW}   Run: supabase start${NC}"
        echo -e "${YELLOW}   Or use DATABASE_URL for remote database${NC}"
        echo ""
    fi
fi

# Fallback: Check for DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✓ Using DATABASE_URL${NC}"
    echo ""

    if command -v psql &> /dev/null; then
        echo -e "${BLUE}Applying schemas using psql...${NC}"
        echo ""

        for schema_file in "${SCHEMA_FILES[@]}"; do
            filename=$(basename "$schema_file")
            echo -e "${BLUE}📄 Applying: ${filename}${NC}"

            if psql "$DATABASE_URL" -f "$schema_file"; then
                echo -e "${GREEN}   ✅ Successfully applied${NC}"
            else
                echo -e "${RED}   ❌ Failed to apply${NC}"
            fi
            echo ""
        done

        echo -e "${GREEN}✅ Schema application complete!${NC}"
        exit 0
    else
        echo -e "${RED}❌ psql command not found${NC}"
        echo -e "${YELLOW}   Install PostgreSQL client tools to use DATABASE_URL${NC}"
        echo ""
    fi
fi

# Manual instructions
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Manual Schema Application Required              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Neither Supabase CLI nor DATABASE_URL is configured.${NC}"
echo -e "${YELLOW}Please apply the schemas manually:${NC}"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of each file in order:"
echo ""
for schema_file in "${SCHEMA_FILES[@]}"; do
    filename=$(basename "$schema_file")
    echo "   - $filename"
done
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
