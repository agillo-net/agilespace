#!/bin/bash

# Sync Local User with Production Space Memberships
# Adds your local authenticated user to all spaces as admin
#
# Usage:
#   ./supabase/scripts/sync-local-user.sh [email]
#
# Examples:
#   ./supabase/scripts/sync-local-user.sh                    # Uses git config email
#   ./supabase/scripts/sync-local-user.sh user@example.com   # Uses provided email

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get email from argument or git config
if [ -n "$1" ]; then
    USER_EMAIL="$1"
else
    # Try to get email from git config
    USER_EMAIL=$(git config user.email 2>/dev/null || echo "")

    if [ -z "$USER_EMAIL" ]; then
        echo -e "${RED}❌ Error: No email provided${NC}"
        echo ""
        echo "Usage:"
        echo "  ./supabase/scripts/sync-local-user.sh [email]"
        echo ""
        echo "Examples:"
        echo "  ./supabase/scripts/sync-local-user.sh user@example.com"
        echo ""
        echo "Or configure git email:"
        echo "  git config user.email \"user@example.com\""
        echo ""
        exit 1
    fi
fi

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Sync Local User with Spaces        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

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

echo -e "${BLUE}📧 Email: ${USER_EMAIL}${NC}"
echo ""

# Get or create user
echo -e "${YELLOW}👤 Finding or creating user...${NC}"
USER_ID=$(psql "$LOCAL_DB_URL" -t -c "SELECT id FROM auth.users WHERE email = '$USER_EMAIL';" | xargs)

if [ -z "$USER_ID" ]; then
    echo -e "${YELLOW}   Creating new user...${NC}"

    # Create user in auth.users
    USER_ID=$(psql "$LOCAL_DB_URL" -t -c "
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            '$USER_EMAIL',
            crypt('password123', gen_salt('bf')),
            NOW(),
            '{\"provider\":\"email\",\"providers\":[\"email\"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id;
    " | xargs)

    echo -e "${GREEN}   ✅ Created user: $USER_ID${NC}"
else
    echo -e "${GREEN}   ✅ Found existing user: $USER_ID${NC}"
fi
echo ""

# Ensure profile exists and cleanup duplicates
echo -e "${YELLOW}👤 Creating/updating profile...${NC}"

# Get GitHub metadata from auth.users
GITHUB_DATA=$(psql "$LOCAL_DB_URL" -t -c "SELECT raw_user_meta_data FROM auth.users WHERE id = '$USER_ID';" | xargs)

# Extract github_id if available (it's in the JSON as provider_id or sub)
GITHUB_ID=$(echo "$GITHUB_DATA" | grep -o '"provider_id":"[0-9]*"' | cut -d'"' -f4)
if [ -z "$GITHUB_ID" ]; then
    GITHUB_ID=$(echo "$GITHUB_DATA" | grep -o '"sub":"[0-9]*"' | cut -d'"' -f4)
fi

# Check for duplicate profile with same github_id
if [ -n "$GITHUB_ID" ]; then
    DUPLICATE_PROFILE=$(psql "$LOCAL_DB_URL" -t -c "SELECT id FROM profiles WHERE github_id = $GITHUB_ID AND id != '$USER_ID';" | xargs)

    if [ -n "$DUPLICATE_PROFILE" ]; then
        echo -e "${YELLOW}   ⚠️  Found duplicate profile with github_id $GITHUB_ID${NC}"
        psql "$LOCAL_DB_URL" -c "DELETE FROM profiles WHERE id = '$DUPLICATE_PROFILE';" > /dev/null
        echo -e "${GREEN}   ✅ Removed duplicate profile${NC}"
    fi
fi

PROFILE_EXISTS=$(psql "$LOCAL_DB_URL" -t -c "SELECT 1 FROM profiles WHERE id = '$USER_ID';" | xargs)

if [ -z "$PROFILE_EXISTS" ]; then
    # Extract name from email (before @) or from GitHub data
    USER_NAME=$(echo "$USER_EMAIL" | cut -d'@' -f1)
    GITHUB_USERNAME=$(echo "$GITHUB_DATA" | grep -o '"user_name":"[^"]*"' | cut -d'"' -f4)
    FULL_NAME=$(echo "$GITHUB_DATA" | grep -o '"full_name":"[^"]*"' | cut -d'"' -f4)
    AVATAR_URL=$(echo "$GITHUB_DATA" | grep -o '"avatar_url":"[^"]*"' | cut -d'"' -f4)

    # Use full_name if available, otherwise username, otherwise email prefix
    DISPLAY_NAME="${FULL_NAME:-${USER_NAME}}"

    psql "$LOCAL_DB_URL" -c "
        INSERT INTO profiles (id, full_name, github_username, github_id, avatar_url, created_at)
        VALUES (
            '$USER_ID',
            '${DISPLAY_NAME}',
            $([ -n "$GITHUB_USERNAME" ] && echo "'$GITHUB_USERNAME'" || echo "NULL"),
            $([ -n "$GITHUB_ID" ] && echo "$GITHUB_ID" || echo "NULL"),
            $([ -n "$AVATAR_URL" ] && echo "'$AVATAR_URL'" || echo "NULL"),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            github_username = COALESCE(EXCLUDED.github_username, profiles.github_username),
            github_id = COALESCE(EXCLUDED.github_id, profiles.github_id),
            avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
    " > /dev/null
    echo -e "${GREEN}   ✅ Created profile for user${NC}"
else
    # Update existing profile with GitHub data if available
    if [ -n "$GITHUB_ID" ]; then
        GITHUB_USERNAME=$(echo "$GITHUB_DATA" | grep -o '"user_name":"[^"]*"' | cut -d'"' -f4)
        FULL_NAME=$(echo "$GITHUB_DATA" | grep -o '"full_name":"[^"]*"' | cut -d'"' -f4)
        AVATAR_URL=$(echo "$GITHUB_DATA" | grep -o '"avatar_url":"[^"]*"' | cut -d'"' -f4)

        psql "$LOCAL_DB_URL" -c "
            UPDATE profiles SET
                github_id = COALESCE($GITHUB_ID, github_id),
                github_username = COALESCE($([ -n "$GITHUB_USERNAME" ] && echo "'$GITHUB_USERNAME'" || echo "NULL"), github_username),
                full_name = COALESCE($([ -n "$FULL_NAME" ] && echo "'$FULL_NAME'" || echo "NULL"), full_name),
                avatar_url = COALESCE($([ -n "$AVATAR_URL" ] && echo "'$AVATAR_URL'" || echo "NULL"), avatar_url)
            WHERE id = '$USER_ID';
        " > /dev/null
        echo -e "${GREEN}   ✅ Updated profile with GitHub data${NC}"
    else
        echo -e "${BLUE}   ℹ️  Profile already exists${NC}"
    fi
fi
echo ""

# Get all spaces
echo -e "${YELLOW}🏢 Adding user to all spaces as admin...${NC}"
SPACES=$(psql "$LOCAL_DB_URL" -t -c "SELECT id FROM spaces;")

if [ -z "$SPACES" ]; then
    echo -e "${YELLOW}   No spaces found${NC}"
    echo ""
else
    SPACE_COUNT=0
    while IFS= read -r SPACE_ID; do
        SPACE_ID=$(echo "$SPACE_ID" | xargs)
        if [ -n "$SPACE_ID" ]; then
            # Check if membership already exists
            EXISTS=$(psql "$LOCAL_DB_URL" -t -c "SELECT 1 FROM space_members WHERE space_id = '$SPACE_ID' AND user_id = '$USER_ID';" | xargs)

            if [ -z "$EXISTS" ]; then
                psql "$LOCAL_DB_URL" -c "
                    INSERT INTO space_members (space_id, user_id, role, joined_at)
                    VALUES ('$SPACE_ID', '$USER_ID', 'admin', NOW())
                    ON CONFLICT DO NOTHING;
                " > /dev/null
                echo -e "${GREEN}   ✅ Added to space: $SPACE_ID${NC}"
                ((SPACE_COUNT++))
            else
                echo -e "${BLUE}   ℹ️  Already member of: $SPACE_ID${NC}"
            fi
        fi
    done <<< "$SPACES"

    echo ""
    echo -e "${GREEN}✅ Added to $SPACE_COUNT space(s)${NC}"
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Summary                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Email:    ${USER_EMAIL}${NC}"
echo -e "${GREEN}User ID:  ${USER_ID}${NC}"
echo ""

# Check if user already existed in auth.users
EXISTING_USER=$(psql "$LOCAL_DB_URL" -t -c "SELECT email_confirmed_at FROM auth.users WHERE id = '$USER_ID';" | xargs)
if [ -z "$EXISTING_USER" ] || [ "$EXISTING_USER" = "null" ]; then
    echo -e "${YELLOW}⚠️  Note: This user was created locally with password: password123${NC}"
    echo ""
    echo -e "${YELLOW}💡 To test authenticated API calls:${NC}"
    echo -e "${YELLOW}   1. Sign in at: http://127.0.0.1:54323 (Supabase Studio)${NC}"
    echo -e "${YELLOW}   2. Email: ${USER_EMAIL}${NC}"
    echo -e "${YELLOW}   3. Password: password123${NC}"
else
    echo -e "${GREEN}✅ User already existed in the database${NC}"
    echo ""
    echo -e "${YELLOW}💡 For testing, you can:${NC}"
    echo -e "${YELLOW}   - Use the service role key to bypass authentication${NC}"
    echo -e "${YELLOW}   - Sign in through your app at http://localhost:PORT${NC}"
fi
echo ""
echo -e "${GREEN}✅ Done!${NC}"
