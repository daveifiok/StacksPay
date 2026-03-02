#!/usr/bin/env node

/**
 * Generate Chainhook Predicate Configuration Files
 *
 * This script generates the Chainhook predicate JSON files from the backend service
 * configuration. Run this script to create or update the predicate files.
 *
 * Usage:
 *   node scripts/generate-chainhook-predicates.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function generatePredicates() {
  console.log('🔄 Generating Chainhook predicate configurations...\n');

  try {
    // Import the Chainhook service
    const { stxChainhookService } = require('../dist/services/chainhook/stx-chainhook-service');

    // Get configurations
    const transfersConfig = stxChainhookService.getChainhookSTXTransferConfig();
    const contractConfig = stxChainhookService.getChainhookContractConfig();

    // Create output directory
    const predicatesDir = path.join(__dirname, '..', 'chainhook', 'predicates');
    if (!fs.existsSync(predicatesDir)) {
      fs.mkdirSync(predicatesDir, { recursive: true });
      console.log(`✅ Created directory: ${predicatesDir}`);
    }

    // Write transfers predicate
    const transfersPath = path.join(predicatesDir, 'stx-transfers.json');
    fs.writeFileSync(transfersPath, JSON.stringify(transfersConfig, null, 2));
    console.log(`✅ Generated: ${transfersPath}`);

    // Write contract predicate
    const contractPath = path.join(predicatesDir, 'stx-contract-events.json');
    fs.writeFileSync(contractPath, JSON.stringify(contractConfig, null, 2));
    console.log(`✅ Generated: ${contractPath}`);

    // Create Chainhook config file
    const chainhookConfig = {
      storage: {
        working_dir: 'chainhook-data'
      },
      network: {
        mode: process.env.STACKS_NETWORK || 'testnet',
        stacks_node_rpc_url: process.env.STACKS_API_URL || 'https://api.testnet.hiro.so'
      },
      http_api: {
        http_port: 20456,
        database_uri: 'chainhook.sqlite'
      },
      limits: {
        max_number_of_predicates: 100,
        max_caching_duration_in_seconds: 300
      }
    };

    const configPath = path.join(__dirname, '..', 'chainhook', 'chainhook-config.toml');

    // Convert to TOML format
    const toml = `[storage]
working_dir = "${chainhookConfig.storage.working_dir}"

[network]
mode = "${chainhookConfig.network.mode}"
stacks_node_rpc_url = "${chainhookConfig.network.stacks_node_rpc_url}"

[http_api]
http_port = ${chainhookConfig.http_api.http_port}
database_uri = "${chainhookConfig.http_api.database_uri}"

[limits]
max_number_of_predicates = ${chainhookConfig.limits.max_number_of_predicates}
max_caching_duration_in_seconds = ${chainhookConfig.limits.max_caching_duration_in_seconds}
`;

    fs.writeFileSync(configPath, toml);
    console.log(`✅ Generated: ${configPath}`);

    // Print summary
    console.log('\n📋 Summary:');
    console.log('━'.repeat(60));
    console.log(`Predicates Directory: ${predicatesDir}`);
    console.log(`Config File: ${configPath}`);
    console.log('\n📝 Generated Files:');
    console.log(`  1. stx-transfers.json     - Monitors all STX transfers`);
    console.log(`  2. stx-contract-events.json - Monitors contract events`);
    console.log(`  3. chainhook-config.toml   - Chainhook service config`);

    console.log('\n🚀 Next Steps:');
    console.log('━'.repeat(60));
    console.log('1. Install Chainhook:');
    console.log('   brew install chainhook');
    console.log('');
    console.log('2. Start Chainhook service:');
    console.log('   cd backend/chainhook');
    console.log('   chainhook service start --config-path=chainhook-config.toml --predicate-path=predicates');
    console.log('');
    console.log('3. In a new terminal, register predicates:');
    console.log('   chainhook predicates apply predicates/stx-transfers.json --config-path=chainhook-config.toml');
    console.log('   chainhook predicates apply predicates/stx-contract-events.json --config-path=chainhook-config.toml');
    console.log('');
    console.log('4. Verify predicates are registered:');
    console.log('   chainhook predicates list --config-path=chainhook-config.toml');
    console.log('');
    console.log('✅ Your payment status will now update automatically!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Error generating predicates:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Backend is compiled (npm run build)');
    console.error('  2. Environment variables are set in .env');
    console.error('  3. You are in the backend directory');
    process.exit(1);
  }
}

// Run the generator
generatePredicates();
