#!/usr/bin/env node
/**
 * Migration script to completely fix email index for wallet registrations
 * This script:
 * 1. Drops the existing sparse email index
 * 2. Removes email field from documents where it's null/empty
 * 3. Creates a partial index that only indexes documents with email field present
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackspay';

async function fixEmailIndexCompletely() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('merchants');
    
    // 1. Drop all existing email indexes
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index');
    } catch (error) {
      console.log('ℹ️  email_1 index not found');
    }
    
    try {
      await collection.dropIndex('email_1_sparse');
      console.log('✅ Dropped email_1_sparse index');
    } catch (error) {
      console.log('ℹ️  email_1_sparse index not found');
    }
    
    // 2. Remove email field from documents where it's null or empty
    const updateResult = await collection.updateMany(
      { $or: [{ email: null }, { email: '' }] },
      { $unset: { email: '' } }
    );
    console.log(`✅ Removed email field from ${updateResult.modifiedCount} documents`);
    
    // 3. Create partial index that only indexes documents with email field present and not empty
    await collection.createIndex(
      { email: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { 
          email: { $exists: true, $ne: null, $ne: '' } 
        },
        name: 'email_1_partial'
      }
    );
    console.log('✅ Created new partial unique index on email');
    
    // 4. List current indexes to verify
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.partialFilterExpression) {
        console.log(`    Partial filter: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });
    
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
  fixEmailIndexCompletely();
}

module.exports = { fixEmailIndexCompletely };
