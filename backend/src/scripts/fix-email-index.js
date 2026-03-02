#!/usr/bin/env node
/**
 * Migration script to fix email index for wallet registrations
 * This script:
 * 1. Drops the existing unique email index
 * 2. Updates all empty email strings to null
 * 3. Creates a new sparse unique index on email
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackspay';

async function fixEmailIndex() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('merchants');
    
    // 1. Drop the existing email index
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped existing email index');
    } catch (error) {
      console.log('ℹ️  Email index not found or already dropped');
    }
    
    // 2. Update all empty email strings to null
    const updateResult = await collection.updateMany(
      { email: '' },
      { $set: { email: null } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} merchants with empty emails to null`);
    
    // 3. Create new sparse unique index on email
    await collection.createIndex(
      { email: 1 }, 
      { unique: true, sparse: true, name: 'email_1_sparse' }
    );
    console.log('✅ Created new sparse unique index on email');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration
if (require.main === module) {
  fixEmailIndex();
}

module.exports = { fixEmailIndex };
