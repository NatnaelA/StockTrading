#!/usr/bin/env ts-node

/**
 * Firebase to Supabase Migration Script
 * 
 * This script helps migrate data from Firebase to Supabase.
 * 
 * Requirements:
 * - Node.js 14+
 * - Firebase Admin SDK
 * - Supabase JS Client
 * - Firebase service account key
 * 
 * Usage:
 * ts-node migrate-firebase-to-supabase.ts
 */

import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountPath && !serviceAccountKey) {
  console.error('No Firebase service account credentials provided.');
  process.exit(1);
}

let serviceAccount;
if (serviceAccountPath) {
  // Read from file
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else if (serviceAccountKey) {
  // Read from env var
  serviceAccount = JSON.parse(serviceAccountKey);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Firebase references
const db = admin.firestore();
const auth = admin.auth();

async function migrateUsers() {
  console.log('🔄 Migrating users...');
  
  try {
    // Get all Firebase users
    const result = await auth.listUsers();
    const users = result.users;
    
    console.log(`Found ${users.length} Firebase users`);
    
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      // Check if user exists in Supabase
      const { data: existingUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`User ${user.email} already exists in Supabase, skipping...`);
        continue;
      }
      
      // Get Firestore user document
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      // Create user in Supabase auth
      const { data: supabaseUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email || '',
        password: '************', // You can't migrate passwords directly
        email_confirm: true,
        user_metadata: {
          displayName: user.displayName || userData?.displayName,
          photoURL: user.photoURL || userData?.photoURL,
        }
      });
      
      if (createError) {
        console.error(`Error creating user ${user.email}:`, createError);
        continue;
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.user.id,
          email: user.email,
          display_name: user.displayName || userData?.displayName,
          photo_url: user.photoURL || userData?.photoURL,
          profile_completed: userData?.profileCompleted || false,
          created_at: userData?.createdAt || new Date().toISOString(),
          updated_at: userData?.updatedAt || new Date().toISOString()
        });
      
      if (profileError) {
        console.error(`Error creating profile for ${user.email}:`, profileError);
      } else {
        console.log(`✅ Successfully migrated user: ${user.email}`);
      }
    }
    
    console.log('✅ User migration completed');
  } catch (error) {
    console.error('Error migrating users:', error);
  }
}

async function migratePortfolios() {
  console.log('🔄 Migrating portfolios...');
  
  try {
    // Get all Firebase portfolios
    const portfolioSnapshot = await db.collection('portfolios').get();
    
    console.log(`Found ${portfolioSnapshot.size} portfolios`);
    
    for (const doc of portfolioSnapshot.docs) {
      const portfolio = doc.data();
      const userId = portfolio.userId;
      
      // Find the corresponding Supabase user
      const { data: userMapping } = await supabase
        .from('user_mapping')
        .select('supabase_id')
        .eq('firebase_id', userId)
        .single();
      
      if (!userMapping) {
        console.log(`No Supabase user found for Firebase user ${userId}, skipping portfolio...`);
        continue;
      }
      
      const supabaseUserId = userMapping.supabase_id;
      
      // Insert portfolio into Supabase
      const { error } = await supabase
        .from('portfolios')
        .insert({
          id: portfolio.id,
          user_id: supabaseUserId,
          name: portfolio.name,
          balance: portfolio.balance,
          currency: portfolio.currency,
          holdings: portfolio.holdings,
          total_value: portfolio.totalValue,
          day_change: portfolio.dayChange,
          day_change_percentage: portfolio.dayChangePercentage,
          created_at: portfolio.createdAt,
          updated_at: portfolio.updatedAt
        });
      
      if (error) {
        console.error(`Error migrating portfolio ${portfolio.id}:`, error);
      } else {
        console.log(`✅ Successfully migrated portfolio: ${portfolio.id}`);
      }
    }
    
    console.log('✅ Portfolio migration completed');
  } catch (error) {
    console.error('Error migrating portfolios:', error);
  }
}

async function migrateTransactions() {
  console.log('🔄 Migrating transactions...');
  
  try {
    // Get all Firebase transactions
    const transactionSnapshot = await db.collection('transactions').get();
    
    console.log(`Found ${transactionSnapshot.size} transactions`);
    
    for (const doc of transactionSnapshot.docs) {
      const transaction = doc.data();
      const userId = transaction.userId;
      
      // Find the corresponding Supabase user
      const { data: userMapping } = await supabase
        .from('user_mapping')
        .select('supabase_id')
        .eq('firebase_id', userId)
        .single();
      
      if (!userMapping) {
        console.log(`No Supabase user found for Firebase user ${userId}, skipping transaction...`);
        continue;
      }
      
      const supabaseUserId = userMapping.supabase_id;
      
      // Insert transaction into Supabase
      const { error } = await supabase
        .from('transactions')
        .insert({
          id: transaction.id,
          user_id: supabaseUserId,
          portfolio_id: transaction.portfolioId,
          stock_symbol: transaction.stockSymbol,
          type: transaction.type,
          quantity: transaction.quantity,
          price: transaction.price,
          fee: transaction.fee,
          total_amount: transaction.totalAmount,
          date: transaction.date,
          status: transaction.status,
          notes: transaction.notes
        });
      
      if (error) {
        console.error(`Error migrating transaction ${transaction.id}:`, error);
      } else {
        console.log(`✅ Successfully migrated transaction: ${transaction.id}`);
      }
    }
    
    console.log('✅ Transaction migration completed');
  } catch (error) {
    console.error('Error migrating transactions:', error);
  }
}

async function main() {
  console.log('🚀 Starting Firebase to Supabase migration...');
  
  // Create temporary mapping table if needed
  const { error: tableError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_mapping (
        firebase_id TEXT PRIMARY KEY,
        supabase_id UUID REFERENCES auth.users(id),
        migrated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  
  if (tableError) {
    console.error('Error creating mapping table:', tableError);
  }
  
  await migrateUsers();
  await migratePortfolios();
  await migrateTransactions();
  
  console.log('✅ Migration completed!');
  
  // Drop the temporary mapping table
  const { error: dropError } = await supabase.rpc('execute_sql', {
    sql: 'DROP TABLE IF EXISTS user_mapping;'
  });
  
  if (dropError) {
    console.error('Error dropping mapping table:', dropError);
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 