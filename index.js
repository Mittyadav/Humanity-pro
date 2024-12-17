// index.js
const inquirer = require('inquirer');
const clear = require('console-clear');
const figlet = require('figlet');
const chalk = require('chalk');
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const { claimFaucet, getPublicIP } = require('./scripts/apis');
const {
  RPC_URL,
  CHAIN_ID,
  SYMBOL,
  TX_EXPLORER,
  REWARD_CONTRACT,
  CLAIM_REWARD_DATA
} = require('./ABI');

// Paths to files
const walletsPath = path.join(__dirname, 'wallets.json');
const proxiesPath = path.join(__dirname, 'proxies.txt');

// Load wallets
let wallets = [];
try {
  const walletsData = fs.readFileSync(walletsPath, 'utf8');
  wallets = JSON.parse(walletsData);
} catch (error) {
  console.error(chalk.red('📛 Failed to load wallets.json:'), error.message);
  process.exit(1);
}

// Load proxies
let proxies = [];
try {
  const proxiesData = fs.readFileSync(proxiesPath, 'utf8');
  proxies = proxiesData.split('\n').filter(line => line.trim() !== '');
} catch (error) {
  console.error(chalk.red('📛 Failed to load proxies.txt:'), error.message);
  process.exit(1);
}

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
  chainId: CHAIN_ID,
  name: 'humanity-testnet'
});

// Initialize counter
let consecutiveDays = 0;

// Function to display the banner
function displayBanner() {
  const banner = figlet.textSync('Humanity Protocol', {
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  console.log(chalk.green(banner));
  console.log(chalk.green('👑 Script Created by Naeaex'));
  console.log(chalk.green('🙌 Welcome to auto-check-in script for Humanity Protocol\n'));
}

// Function to start claiming daily rewards
async function startClaimingRewards() {
  for (const wallet of wallets) {
    const { privateKey, wallet: walletAddress } = wallet;
    const walletInstance = new ethers.Wallet(privateKey, provider);

    const tx = {
      to: REWARD_CONTRACT,
      data: CLAIM_REWARD_DATA,
      gasLimit: 100000
    };

    try {
      const transaction = await walletInstance.sendTransaction(tx);
      console.log(chalk.blue(`🚀 [${walletAddress}] Transaction sent. TxHash: ${transaction.hash}`));

      const receipt = await transaction.wait();
      console.log(chalk.green(`✅ [${walletAddress}] Transaction confirmed in block ${receipt.blockNumber}`));
    } catch (error) {
      console.error(chalk.red(`❌ [${walletAddress}] Failed to claim reward: ${error.message}`));
    }
  }

  consecutiveDays += 1;
  console.log(chalk.yellow(`📅 Consecutive Days performing check-in for all Wallets: ${consecutiveDays}\n`));

  // Wait for 24 hours before next run
  setTimeout(startClaimingRewards, 24 * 60 * 60 * 1000);
}

// Function to claim faucet
async function claimFaucetForAllWallets() {
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const proxy = proxies[i % proxies.length];

    // Extract Proxy ID
    const proxyIdMatch = proxy.match(/zone-custom-session-([a-zA-Z0-9]+)-/);
    const proxyId = proxyIdMatch ? proxyIdMatch[1] : 'Unknown';

    // Get Public Proxy IP
    let proxyIp = 'Unknown';
    try {
      proxyIp = await getPublicIP(proxy);
    } catch (error) {
      console.error(chalk.red(`❌ Failed to retrieve public IP for Proxy ID: ${proxyId} - ${error.message}`));
    }

    try {
      console.log(chalk.blue(`🔄 Using Proxy ID: ${proxyId} for Wallet: [${wallet.wallet}]`));
      console.log(chalk.magenta(`📡 Retrieved Public Proxy IP: ${proxyIp}`));
      console.log(chalk.blue(`📤 Sending Claiming Request...`));

      const txHash = await claimFaucet(wallet.wallet, proxy);
      console.log(chalk.green(`🎉 Faucet successfully Claimed for Wallet [${wallet.wallet}]`));
      console.log(chalk.cyan(`🔗 View Transaction: ${TX_EXPLORER}${txHash}\n`));
    } catch (error) {
      console.error(chalk.red(`❌ [${wallet.wallet}] Failed to claim faucet: ${error.message}\n`));
    }
  }
}

// Main menu
async function mainMenu() {
  clear();
  displayBanner();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Select an option:',
      choices: [
        '1. Start Claiming Daily Rewards',
        '2. Claim Faucet',
        '0. Exit'
      ]
    }
  ]);

  switch (answers.option) {
    case '1. Start Claiming Daily Rewards':
      await startClaimingRewards();
      break;
    case '2. Claim Faucet':
      await claimFaucetForAllWallets();
      await mainMenu();
      break;
    case '0. Exit':
      console.log(chalk.green('👋 Goodbye!'));
      process.exit(0);
      break;
    default:
      await mainMenu();
      break;
  }
}

// Start the application
mainMenu();
