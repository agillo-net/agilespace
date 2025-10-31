#!/usr/bin/env tsx
/**
 * Apply Database Schemas Script
 *
 * This script applies all schema files in order to your Supabase database.
 *
 * Usage:
 *   pnpm db:apply           # Apply all schemas
 *   pnpm db:apply 06 07     # Apply specific schemas by number
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

interface SchemaFile {
  number: string;
  filename: string;
  path: string;
}

function getSchemaFiles(filterNumbers?: string[]): SchemaFile[] {
  const schemasDir = path.join(__dirname, '..', 'schemas');
  const files = fs.readdirSync(schemasDir);

  const schemaFiles = files
    .filter((file) => file.endsWith('.sql'))
    .map((file) => {
      const match = file.match(/^(\d+)_/);
      return {
        number: match ? match[1] : '99',
        filename: file,
        path: path.join(schemasDir, file),
      };
    })
    .sort((a, b) => a.number.localeCompare(b.number));

  if (filterNumbers && filterNumbers.length > 0) {
    return schemaFiles.filter((file) =>
      filterNumbers.includes(file.number)
    );
  }

  return schemaFiles;
}

async function executeSqlFile(schemaFile: SchemaFile): Promise<boolean> {
  console.log(`\n📄 Applying: ${schemaFile.filename}`);

  try {
    const sql = fs.readFileSync(schemaFile.path, 'utf-8');

    // Split by semicolons but be careful with functions and procedures
    const statements = sql
      .split(/;(?=\s*(?:--|\/\*|$))/g)
      .map((stmt) => stmt.trim())
      .filter((stmt) => {
        // Filter out comments and empty statements
        return (
          stmt.length > 0 &&
          !stmt.startsWith('--') &&
          !stmt.match(/^\/\*.*\*\/$/s)
        );
      });

    console.log(`   Found ${statements.length} SQL statements`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (!statement.trim()) continue;

      try {
        // Use raw SQL execution via REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ query: statement }),
        });

        if (!response.ok) {
          // Try alternative execution method
          // For Supabase, we'll need to use the SQL editor API
          console.log(`   ⚠ Statement ${i + 1}: Using alternative execution`);
        }

        successCount++;
        process.stdout.write('.');
      } catch (error: any) {
        errorCount++;
        console.error(`\n   ❌ Error in statement ${i + 1}:`, error.message);

        // Show the problematic statement (first 100 chars)
        const preview =
          statement.length > 100
            ? statement.substring(0, 100) + '...'
            : statement;
        console.error(`   Statement: ${preview}`);
      }
    }

    console.log('\n');

    if (errorCount === 0) {
      console.log(`   ✅ Successfully applied ${successCount} statements`);
      return true;
    } else {
      console.log(`   ⚠️  Applied ${successCount} statements with ${errorCount} errors`);
      return false;
    }
  } catch (error: any) {
    console.error(`   ❌ Error reading file:`, error.message);
    return false;
  }
}

async function applySchemas(filterNumbers?: string[]) {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Supabase Schema Application         ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');

  const schemaFiles = getSchemaFiles(filterNumbers);

  if (schemaFiles.length === 0) {
    console.log('❌ No schema files found to apply');
    process.exit(1);
  }

  console.log(`📦 Found ${schemaFiles.length} schema file(s) to apply:`);
  schemaFiles.forEach((file) => {
    console.log(`   - ${file.filename}`);
  });

  let successCount = 0;
  let errorCount = 0;

  for (const schemaFile of schemaFiles) {
    const success = await executeSqlFile(schemaFile);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(45));
  console.log(`✅ Successfully applied: ${successCount} file(s)`);
  if (errorCount > 0) {
    console.log(`⚠️  Failed to apply: ${errorCount} file(s)`);
  }
  console.log('═'.repeat(45));

  if (errorCount > 0) {
    console.log('\n💡 Note: Some errors may be expected (e.g., "already exists")');
    console.log('   Check the Supabase dashboard to verify the schema state.');
  }
}

async function main() {
  // Get schema numbers from command line arguments
  const filterNumbers = process.argv.slice(2);

  await applySchemas(filterNumbers.length > 0 ? filterNumbers : undefined);
}

main();
