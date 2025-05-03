#!/usr/bin/env node

/**
 * Test Supabase Connection
 * 
 * This script tests the connection to your Supabase project.
 * It will read your Supabase credentials from the .env.local file
 * and attempt to connect to your Supabase project.
 * 
 * Usage:
 * node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
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

// Get Supabase credentials
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local file');
  console.log('Please ensure your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  process.exit(1);
}

console.log('🔑 Found Supabase credentials in .env.local file');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anonymous Key: ${supabaseAnonKey.substring(0, 5)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testConnection() {
  try {
    console.log('🔄 Testing connection to Supabase...');
    
    // Test auth service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service error:', authError.message);
    } else {
      console.log('✅ Auth service connection successful');
    }
    
    // Test database service by checking if the 'users' table exists
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .limit(0);
    
    if (dbError) {
      if (dbError.code === '42P01') {
        console.error('❌ Database error: Table "users" does not exist. Have you run the migrations?');
      } else {
        console.error('❌ Database error:', dbError.message);
      }
    } else {
      console.log('✅ Database connection successful');
      console.log(`📊 Found users table with data: ${JSON.stringify(dbData)}`);
    }
    
    // Test storage service
    const { data: storageData, error: storageError } = await supabase
      .storage
      .listBuckets();
    
    if (storageError) {
      console.error('❌ Storage service error:', storageError.message);
    } else {
      console.log('✅ Storage service connection successful');
      console.log(`🗄️ Found ${storageData.length} storage buckets`);
    }
    
    console.log('\n🔍 Overall connection test:');
    if (!authError && !dbError && !storageError) {
      console.log('✅ Successfully connected to Supabase!');
    } else {
      console.log('⚠️ Some connection tests failed. See details above.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testConnection(); 