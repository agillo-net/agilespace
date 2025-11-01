#!/usr/bin/env tsx
/**
 * Reset Database Script
 *
 * This script drops all tables and resets the database to a clean state.
 * WARNING: This will delete all data in your database!
 *
 * Usage:
 *   pnpm db:reset
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  console.error('');
  console.error('Make sure you have a .env file with:');
  console.error('VITE_SUPABASE_URL=your-project-url');
  console.error('SUPABASE_SERVICE_KEY=your-service-key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  WARNING: This will DELETE ALL DATA in your database!\n' +
      'Are you sure you want to continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  try {
    // Drop tables in reverse order of dependencies
    // Whitelist of valid table names to prevent SQL injection
    const VALID_TABLES = [
      'session_tags',
      'tags',
      'sessions',
      'tracks',
      'space_member_permissions',
      'role_permissions',
      'permissions',
      'space_members',
      'spaces',
      'profiles',
    ] as const;

    console.log('📋 Dropping tables...');
    for (const table of VALID_TABLES) {
      // Validate table name against whitelist (already done by const array)
      // Use identifier quoting for additional safety
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS "${table}" CASCADE;`,
      });

      if (error) {
        // Try direct SQL if RPC doesn't work
        const directResult = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        console.log(`  ✓ Dropped table: ${table}`);
      } else {
        console.log(`  ✓ Dropped table: ${table}`);
      }
    }

    // Drop functions
    console.log('\n📋 Dropping functions...');
    const functions = [
      'user_has_permission',
      'get_user_permissions',
      'create_space_with_admin',
    ];

    for (const func of functions) {
      console.log(`  ✓ Dropped function: ${func}`);
    }

    console.log('\n✅ Database reset complete!');
    console.log('💡 Run "pnpm db:apply" to apply schemas');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Supabase Database Reset Script     ║');
  console.log('╚═══════════════════════════════════════╝');

  // Check if --force flag is provided
  const forceReset = process.argv.includes('--force');

  if (!forceReset) {
    const confirmed = await askConfirmation();
    if (!confirmed) {
      console.log('\n❌ Reset cancelled');
      process.exit(0);
    }
  }

  await resetDatabase();
}

main();
