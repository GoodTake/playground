/**
 * Example script demonstrating how to check information about a Token Bound Account (TBA)
 * using the GoTake SDK
 */

import { GoTakeSDK } from '@gotake/gotake-sdk';
import { config } from './config';

async function checkTBA() {
    console.log('🚀 GoTake SDK - TBA Information Check Example');
    console.log('==============================================\n');

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

        console.log('\n📋 Step 2: Get or Create TBA');
        console.log('⏳ Starting...');

        // Get TBA address (create if needed)
        const { tbaAddress, isNew } = await sdk.checkAndCreateTBA();

        if (isNew) {
            console.log('✅ Created new TBA for checking');
        } else {
            console.log('✅ Using existing TBA');
        }
        console.log(`📍 TBA Address: ${tbaAddress}`);

        console.log('\n📋 Step 3: Check TBA Information');
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

        console.log('\n📋 Step 4: Check Associated NFT Information');
        console.log('⏳ Starting...');

        // Check if we can get information about the associated NFT
        try {
            const isOwner = await sdk.ipnft.isOwner(tbaInfo.tokenId, address);
            console.log(`📋 Associated NFT Details:`);
            console.log(`   Token ID: ${tbaInfo.tokenId.toString()}`);
            console.log(`   Contract: ${tbaInfo.tokenContract}`);
            console.log(`   User is Owner: ${isOwner ? '✅ Yes' : '❌ No'}`);

            if (isOwner) {
                const nftDetails = await sdk.ipnft.getNFTDetails(tbaInfo.tokenId);
                console.log(`   Title: ${nftDetails.title}`);
                console.log(`   Description: ${nftDetails.description}`);
                console.log(`   URI: ${nftDetails.uri}`);
            }
        } catch (error: any) {
            console.log(`📋 Associated NFT: Unable to fetch details (${error.message})`);
        }

        console.log(`\n💡 TBA address: ${tbaAddress}`);
        console.log('💡 TBA is ready for use with other operations');

    } catch (error: any) {
        console.error('\n❌ TBA Information Check failed:');
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
checkTBA().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 