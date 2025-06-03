/**
 * Example script demonstrating how to mint an Intellectual Property NFT (IPNFT)
 * using the GoTake SDK
 */

const { GoTakeSDK } = require('@gotake/gotake-sdk/dist/src/index.js');
import { config } from './config';

async function mintIPNFT() {
    console.log('🚀 GoTake SDK - IPNFT Minting Example');
    console.log('=====================================\n');

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

        console.log('\n📋 Step 2: Mint IPNFT');
        console.log('⏳ Starting...');

        // Prepare metadata for the IPNFT
        const metadata = {
            title: 'Example Patent Document',
            description: 'This is an example patent created with GoTake SDK for demonstration purposes',
            creator: address,
            tags: ['patent', 'example', 'gotake-sdk']
        };

        console.log(`📝 Minting IPNFT with metadata:`, {
            title: metadata.title,
            description: metadata.description,
            creator: metadata.creator
        });

        // Mint a new IPNFT using the SDK API
        const result = await sdk.ipnft.mint(address, metadata);
        console.log('⏳ Waiting for transaction confirmation...');

        const receipt = await result.tx.wait();

        console.log('\n🎉 IPNFT Minting completed successfully!');
        console.log(`📝 Transaction hash: ${receipt.transactionHash}`);
        console.log(`📊 Token ID: ${result.tokenId.toString()}`);
        console.log(`📊 Owner: ${address}`);
        console.log(`📊 Block Number: ${receipt.blockNumber}`);

        console.log('\n📋 Step 3: Verify IPNFT Details');
        console.log('⏳ Starting...');

        // Get and display IPNFT information
        const nftDetails = await sdk.ipnft.getNFTDetails(result.tokenId);
        console.log('📋 IPNFT Details:');
        console.log(`   Token ID: ${nftDetails.tokenId.toString()}`);
        console.log(`   Title: ${nftDetails.title}`);
        console.log(`   Description: ${nftDetails.description}`);
        console.log(`   Owner: ${nftDetails.owner}`);
        console.log(`   URI: ${nftDetails.uri}`);
        console.log(`   IP Type: ${nftDetails.ipType}`);
        console.log(`   Created At: ${new Date(nftDetails.createdAt.toNumber() * 1000).toISOString()}`);

        console.log(`\n💡 Save this Token ID for future use: ${result.tokenId.toString()}`);
        console.log('💡 You can use this Token ID to create a TBA in the next example');

    } catch (error: any) {
        console.error('\n❌ IPNFT Minting failed:');
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
mintIPNFT().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 