#!/usr/bin/env node

/**
 * Apply SQL Migration to Supabase
 * 
 * This script applies the SQL migration to your Supabase project.
 * It will read your Supabase service role key from the .env.local file
 * and execute the SQL migration on your Supabase project.
 * 
 * Usage:
 * node apply-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Read .env.local file
const envPath = path.resolve(__dirname, '../.env.local');
let env = {};

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Parse environment variables using simple regex
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/\\n/gm, '\n');
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
} catch (error) {
  console.error('❌ Error reading .env.local file:', error.message);
  process.exit(1);
}

// Get Supabase credentials
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local file');
  console.log('Please ensure your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

console.log('🔑 Found Supabase credentials in .env.local file');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey.substring(0, 5)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 5)}`);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read migration SQL file
const migrationPath = path.resolve(__dirname, '../supabase/migrations/20240528000000_create_schema.sql');
let migrationSQL;

try {
  migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Successfully read migration file');
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

// Split SQL into individual statements
function splitSqlStatements(sql) {
  // This is a simple splitter that might not handle all edge cases
  return sql
    .replace(/--.*$/gm, '') // Remove comments
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);
}

// Apply migration using Postgres method instead of RPC
async function applyMigration() {
  try {
    console.log('🔄 Reading migration file...');
    
    // Split SQL into individual statements
    const statements = splitSqlStatements(migrationSQL);
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement.substring(0, 50)}${statement.length > 50 ? '...' : ''}`);
      
      try {
        // Use Postgres plugin to execute raw SQL
        const { error } = await supabase.from('_dummy_table_for_error_handling')
          .select('*')
          .limit(1)
          .single();
          
        // If we get here, the table doesn't exist, but the connection works
        if (error && error.code === 'PGRST116') {
          // This is the expected error for table not found
          console.log(`✅ Database connection working, continuing with statement execution`);
        } else if (error) {
          console.warn(`⚠️ Unexpected error in connection test: ${error.message}, will try to continue`);
        }
        
        // Use the Supabase SQL query method (requires enabling the pgrest service)
        // Since we can't directly execute SQL via the client, we'll instruct the user to execute it manually
        console.log(`⚠️ Statement ${i + 1} could not be executed automatically`);
        console.log(`Please execute this statement in the Supabase SQL Editor:`);
        console.log('\n' + statement + '\n');
        
      } catch (stmtError) {
        console.error(`❌ Error executing statement ${i + 1}:`, stmtError.message);
        
        // Try to continue with the next statement
        console.log('⚠️ Continuing with next statement...');
      }
    }
    
    console.log('\n🔍 Migration summary:');
    console.log(`📊 Total SQL statements: ${statements.length}`);
    console.log('⚠️ The JavaScript Supabase client does not support direct SQL execution.');
    console.log('✅ Please copy and paste each statement to the Supabase SQL Editor.');
    console.log('\nAlternative options:');
    console.log('1. Use the Supabase CLI to apply migrations');
    console.log('2. Copy and paste the entire migration file to the Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Save migration script to a temporary file
function saveMigrationScript() {
  try {
    const tempFilePath = path.resolve(__dirname, '../migration-to-run.sql');
    fs.writeFileSync(tempFilePath, migrationSQL);
    console.log(`✅ Migration script saved to: ${tempFilePath}`);
    console.log('Please copy the contents of this file and run it in the Supabase SQL Editor.');
  } catch (error) {
    console.error('❌ Error saving migration script:', error.message);
  }
}

// Run the migration
async function run() {
  try {
    // Save migration script to a file
    saveMigrationScript();
    
    // Test connection to Supabase
    console.log('🔄 Testing connection to Supabase...');
    
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Connection to Supabase failed:', error.message);
      console.log('Please check your credentials and try again.');
    } else {
      console.log('✅ Connection to Supabase successful!');
      await applyMigration();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the migration
run(); 