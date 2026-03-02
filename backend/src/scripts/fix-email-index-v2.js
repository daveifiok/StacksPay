#!/usr/bin/env node
/**
 * Migration script v2 to fix email index for wallet registrations
 * This script:
 * 1. Drops all existing email indexes
 * 2. Removes all documents with null emails (start fresh)  
 * 3. Creates a new partial index on email (only for non-null, non-empty emails)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackspay';

async function fixEmailIndexV2() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('merchants');
    
    // 1. Drop all email-related indexes
    try {
      const indexes = await collection.listIndexes().toArray();
      for (const index of indexes) {
        if (index.name.includes('email')) {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        }
      }
    } catch (error) {
      console.log('ℹ️  No email indexes found or already dropped');
    }
    
    // 2. Remove all documents with null emails (clean slate for wallet users)
    const deleteResult = await collection.deleteMany({ email: null });
    console.log(`✅ Removed ${deleteResult.deletedCount} merchants with null emails`);
    
    // 3. Create new partial index on email (only for string type emails - excludes null/undefined)
    await collection.createIndex(
      { email: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { 
          email: { $type: "string" } 
        },
        name: 'email_1_partial'
      }
    );
    console.log('✅ Created new partial unique index on email');
    
    console.log('🎉 Migration v2 completed successfully!');
    console.log('📝 Now wallet users can register without email conflicts');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration
if (require.main === module) {
  fixEmailIndexV2();
}

module.exports = { fixEmailIndexV2 };
