/**
 * Example script demonstrating the complete GoTake SDK workflow:
 * Upload video -> Process -> Mint IPNFT -> Create TBA
 */

const { GoTakeSDK } = require('@gotake/gotake-sdk/dist/src/index.js');
import { config } from './config';

async function fullFlow() {
    console.log('🚀 GoTake SDK - Complete Workflow Example');
    console.log('==========================================\n');

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

        console.log('\n📋 Step 2: Create and Mint IPNFT');
        console.log('⏳ Starting...');

        // Prepare metadata for IPNFT
        const ipnftMetadata = {
            title: 'Complete Workflow Demo IPNFT',
            description: 'An IPNFT created as part of the complete GoTake SDK workflow demonstration',
            creator: address,
            tags: ['workflow', 'demo', 'gotake-sdk']
        };

        console.log(`📝 Minting IPNFT with metadata:`, {
            title: ipnftMetadata.title,
            description: ipnftMetadata.description,
            creator: ipnftMetadata.creator
        });

        // Mint IPNFT
        const mintResult = await sdk.ipnft.mint(address, ipnftMetadata);
        console.log('⏳ Waiting for IPNFT mint transaction confirmation...');

        const mintReceipt = await mintResult.tx.wait();

        console.log('\n🎉 IPNFT Minting completed successfully!');
        console.log(`📝 Transaction hash: ${mintReceipt.transactionHash}`);
        console.log(`📊 Token ID: ${mintResult.tokenId.toString()}`);

        console.log('\n📋 Step 3: Check and Create TBA');
        console.log('⏳ Starting...');

        // Check and create TBA
        const { tbaAddress, isNew } = await sdk.checkAndCreateTBA();

        if (isNew) {
            console.log('\n🎉 TBA Creation completed successfully!');
            console.log(`📝 TBA Address: ${tbaAddress}`);
        } else {
            console.log('✅ Using existing TBA');
            console.log(`📍 TBA Address: ${tbaAddress}`);
        }

        console.log('\n📋 Step 4: Verify Complete Setup');
        console.log('⏳ Starting...');

        // Get IPNFT details
        const nftDetails = await sdk.ipnft.getNFTDetails(mintResult.tokenId);
        console.log('📋 IPNFT Details:');
        console.log(`   Token ID: ${nftDetails.tokenId.toString()}`);
        console.log(`   Title: ${nftDetails.title}`);
        console.log(`   Owner: ${nftDetails.owner}`);

        // Get TBA information
        const tbaInfo = await sdk.account.getTBAInfo(tbaAddress);
        console.log('\n📋 TBA Details:');
        console.log(`   Address: ${tbaAddress}`);
        console.log(`   Chain ID: ${tbaInfo.chainId.toString()}`);
        console.log(`   Token Contract: ${tbaInfo.tokenContract}`);
        console.log(`   Token ID: ${tbaInfo.tokenId.toString()}`);

        // Check if current signer is valid for this TBA
        const isValidSigner = await sdk.account.isValidSigner(tbaAddress, address);
        console.log(`   Valid Signer: ${isValidSigner ? '✅ Yes' : '❌ No'}`);

        // Check balances
        const userBalance = await sdk.provider.getBalance(address);
        const tbaBalance = await sdk.provider.getBalance(tbaAddress);

        console.log('\n📋 Balances:');
        console.log(`   User Balance: ${Number(userBalance) / 1e18} ETH`);
        console.log(`   TBA Balance: ${Number(tbaBalance) / 1e18} ETH`);

        console.log('\n🎉 Complete Workflow Summary:');
        console.log('=====================================');
        console.log(`✅ IPNFT Created: Token ID ${mintResult.tokenId.toString()}`);
        console.log(`✅ TBA ${isNew ? 'Created' : 'Verified'}: ${tbaAddress}`);
        console.log(`✅ Network: ${config.network}`);
        console.log(`✅ User: ${address}`);

        console.log('\n💡 Your setup is complete and ready for use!');
        console.log('💡 You can now use these assets in other GoTake SDK operations');

    } catch (error: any) {
        console.error('\n❌ Complete Workflow failed:');
        if (error.message) {
            console.error(`💬 Error: ${error.message}`);
        }
        if (error.code) {
            console.error(`🔢 Code: ${error.code}`);
        }
        console.error('\n🔧 Troubleshooting:');
        console.error('   - Ensure your private key is valid');
        console.error('   - Check that you have sufficient ETH for gas fees');
        console.error('   - Verify network connectivity');
        process.exit(1);
    }
}

// Execute the example
fullFlow().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 