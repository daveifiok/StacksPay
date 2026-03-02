#!/usr/bin/env node

/**
 * Derive Stacks Private Key from Mnemonic
 *
 * This script takes a 12 or 24-word mnemonic phrase and derives:
 * - The private key (hex format)
 * - The Stacks address (testnet and mainnet)
 *
 * Usage:
 *   node derive-key-from-mnemonic.js
 *   node derive-key-from-mnemonic.js "your twelve word mnemonic phrase here..."
 */

const { generateWallet, generateNewAccount } = require('@stacks/wallet-sdk');
const readline = require('readline');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function printBanner() {
  console.log(colors.cyan + colors.bright);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Stacks Wallet Key Derivation Tool                    ║');
  console.log('║     Derive Private Key from Mnemonic Phrase              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

async function deriveKeysFromMnemonic(mnemonic, showPrivateKey = true) {
  try {
    console.log(colors.yellow + '\n🔄 Deriving keys from mnemonic...' + colors.reset);

    // Clean the mnemonic (remove extra spaces, quotes)
    const cleanedMnemonic = mnemonic.trim().replace(/^["']|["']$/g, '');

    // Validate mnemonic word count
    const wordCount = cleanedMnemonic.split(/\s+/).length;
    if (wordCount !== 12 && wordCount !== 24) {
      throw new Error(`Invalid mnemonic: Expected 12 or 24 words, got ${wordCount}`);
    }

    // Generate wallet from mnemonic (async)
    const wallet = await generateWallet({
      secretKey: cleanedMnemonic,
      password: ''
    });

    // Get the first account (index 0)
    const accounts = wallet.accounts || [];
    if (accounts.length === 0) {
      throw new Error('No accounts found in wallet');
    }

    const account = accounts[0];

    console.log(colors.green + '\n✅ Keys derived successfully!\n' + colors.reset);

    // Display results
    console.log(colors.bright + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset);
    console.log(colors.cyan + colors.bright + '\n📋 DERIVED WALLET INFORMATION:\n' + colors.reset);

    console.log(colors.blue + 'Mnemonic Word Count:' + colors.reset);
    console.log(`  ${wordCount} words\n`);

    console.log(colors.blue + 'Testnet Address (ST...)' + colors.reset);
    console.log(`  ${account.address}\n`);

    if (showPrivateKey) {
      console.log(colors.blue + 'Private Key (Hex):' + colors.reset);
      console.log(`  ${account.stxPrivateKey}\n`);
    } else {
      console.log(colors.yellow + 'Private Key:' + colors.reset);
      console.log(`  [Hidden - use --show-key to display]\n`);
    }

    console.log(colors.blue + 'Account Index:' + colors.reset);
    console.log(`  0 (first account)\n`);

    console.log(colors.bright + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset);

    // Security warning
    console.log(colors.red + '\n⚠️  SECURITY WARNING:' + colors.reset);
    console.log(colors.yellow + '   • Never share your mnemonic or private key');
    console.log('   • Keep them secure and backed up safely');
    console.log('   • Anyone with these can control your funds' + colors.reset + '\n');

    // For .env file
    console.log(colors.cyan + '💡 For .env file, use either:\n' + colors.reset);
    console.log(colors.bright + '   Option 1 (Mnemonic):' + colors.reset);
    console.log(`   STX_BACKEND_PRIVATE_KEY="${cleanedMnemonic}"\n`);
    console.log(colors.bright + '   Option 2 (Hex Private Key):' + colors.reset);
    console.log(`   STX_BACKEND_PRIVATE_KEY=${account.stxPrivateKey}\n`);

    return {
      address: account.address,
      privateKey: account.stxPrivateKey,
      mnemonic: cleanedMnemonic
    };

  } catch (error) {
    console.error(colors.red + '\n❌ Error deriving keys:' + colors.reset);
    console.error(colors.red + `   ${error.message}` + colors.reset + '\n');
    process.exit(1);
  }
}

// Interactive mode - prompt for mnemonic
function promptForMnemonic() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(colors.yellow + '\nEnter your mnemonic phrase (12 or 24 words):' + colors.reset);
  console.log(colors.yellow + '(Input will be hidden for security)\n' + colors.reset);

  // Hide input for security
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  let mnemonic = '';

  stdin.on('data', function(char) {
    char = char.toString('utf8');

    switch (char) {
      case '\n':
      case '\r':
      case '\u0004': // Ctrl-D
        stdin.setRawMode(false);
        stdin.pause();
        console.log('\n');

        if (mnemonic.trim()) {
          deriveKeysFromMnemonic(mnemonic, true).then(() => rl.close());
        } else {
          console.log(colors.red + '❌ No mnemonic entered' + colors.reset);
          rl.close();
        }
        break;
      case '\u0003': // Ctrl-C
        console.log(colors.red + '\n\n❌ Cancelled' + colors.reset);
        process.exit(0);
        break;
      case '\u007f': // Backspace
        mnemonic = mnemonic.slice(0, -1);
        process.stdout.write('\b \b');
        break;
      default:
        mnemonic += char;
        process.stdout.write('*');
        break;
    }
  });
}

// Main execution
async function main() {
  printBanner();

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments - interactive mode
    promptForMnemonic();
  } else if (args[0] === '--help' || args[0] === '-h') {
    // Help text
    console.log('Usage:');
    console.log('  node derive-key-from-mnemonic.js                    # Interactive mode');
    console.log('  node derive-key-from-mnemonic.js "your mnemonic"    # Direct mode');
    console.log('  node derive-key-from-mnemonic.js --help             # Show this help\n');
    console.log('Examples:');
    console.log('  node derive-key-from-mnemonic.js "latin quit chimney fatigue..."');
    console.log('  node derive-key-from-mnemonic.js < mnemonic.txt\n');
  } else {
    // Direct mode - mnemonic provided as argument
    const mnemonic = args.join(' ');
    await deriveKeysFromMnemonic(mnemonic, true);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { deriveKeysFromMnemonic };
