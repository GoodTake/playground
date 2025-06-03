/**
 * Example script demonstrating how to create a Token Bound Account (TBA)
 * using the GoTake SDK's simplified API
 */

const { GoTakeSDK } = require('@gotake/gotake-sdk/dist/src/index.js');
import { config } from './config';

async function createTBA() {
    console.log('🚀 GoTake SDK - TBA Creation Example');
    console.log('====================================\n');

    // Validate environment setup
    if (!config.privateKey) {
        console.error('❌ Missing PRIVATE_KEY in environment variables');
        process.exit(1);
    }

    try {
        console.log('📋 Step 1: Initialize SDK');
        console.log('⏳ Starting...');

        // Initialize the SDK without passing signer - let it read from environment
        const sdk = new GoTakeSDK({
            network: config.network
            // Don't pass signer - SDK will automatically read PRIVATE_KEY from env
        });

        // Get the current address
        const address = await sdk.getAddress();
        console.log(`✅ Connected to network: ${config.network}`);
        console.log(`👤 User address: ${address}`);

        console.log('\n📋 Step 2: Check and Create TBA');
        console.log('⏳ Starting...');

        console.log('🔍 Checking if user has a TBA...');

        // Use the simplified API to check and create TBA
        const { tbaAddress, isNew } = await sdk.checkAndCreateTBA();

        if (isNew) {
            console.log('\n🎉 TBA Creation completed successfully!');
            console.log(`📝 TBA Address: ${tbaAddress}`);
            console.log(`📊 Status: Newly Created`);
        } else {
            console.log('✅ TBA already exists');
            console.log(`📍 TBA Address: ${tbaAddress}`);
        }

        console.log('\n📋 Step 3: Verify TBA Information');
        console.log('⏳ Starting...');

        // Get TBA information
        const tbaInfo = await sdk.account.getTBAInfo(tbaAddress);
        console.log('📋 TBA Details:');
        console.log(`   Address: ${tbaAddress}`);
        console.log(`   Chain ID: ${tbaInfo.chainId.toString()}`);
        console.log(`   Token Contract: ${tbaInfo.tokenContract}`);
        console.log(`   Token ID: ${tbaInfo.tokenId.toString()}`);
        console.log(`   State: ${tbaInfo.state.toString()}`);

        // Check if current signer is valid for this TBA
        const isValidSigner = await sdk.account.isValidSigner(tbaAddress, address);
        console.log(`   Valid Signer: ${isValidSigner ? '✅ Yes' : '❌ No'}`);

        // Check TBA balance
        const balance = await sdk.provider.getBalance(tbaAddress);
        console.log(`   Balance: ${balance.toString()} Wei (${Number(balance) / 1e18} ETH)`);

        console.log(`\n💡 Your TBA address: ${tbaAddress}`);
        console.log('💡 You can now use this TBA in other examples');

    } catch (error: any) {
        console.error('\n❌ TBA Creation failed:');
        if (error.message) {
            console.error(`💬 Error: ${error.message}`);
        }
        if (error.code) {
            console.error(`🔢 Code: ${error.code}`);
        }
        process.exit(1);
    }
}

// Execute the example
createTBA().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 