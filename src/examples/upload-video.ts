/**
 * Example script demonstrating how to upload a video and track its processing status
 * using the GoTake SDK
 */

const { GoTakeSDK } = require('@gotake/gotake-sdk/dist/src/index.js');
import { config } from './config';
import * as fs from 'fs';
import * as path from 'path';

async function uploadVideo() {
    console.log('🚀 GoTake SDK - Video Upload Example');
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

        console.log('\n📋 Step 2: Prepare Video Metadata');
        console.log('⏳ Starting...');

        // Prepare video metadata
        const metadata = {
            title: 'Sample Video Upload',
            description: 'This is a sample video uploaded via GoTake SDK for demonstration purposes',
            creator: address,
            tags: ['sample', 'gotake-sdk', 'demo']
        };

        console.log(`📝 Video metadata:`, {
            title: metadata.title,
            description: metadata.description,
            creator: metadata.creator,
            tags: metadata.tags
        });

        console.log('\n📋 Step 3: Create Mock Video File');
        console.log('⏳ Starting...');

        // For demonstration, create a simple mock file
        // In real usage, you would have an actual video file
        const mockVideoContent = Buffer.from('Mock video file content for SDK demonstration');
        const mockFile = {
            name: 'sample-video.mp4',
            type: 'video/mp4',
            size: mockVideoContent.length,
            stream: () => mockVideoContent
        } as any;

        console.log(`📁 Mock file created: ${mockFile.name} (${mockFile.size} bytes)`);

        console.log('\n📋 Step 4: Upload Video');
        console.log('⏳ Starting...');

        try {
            // Upload video using SDK
            const videoId = await sdk.uploadVideo(mockFile, metadata);

            console.log('\n🎉 Video Upload completed successfully!');
            console.log(`📝 Video ID: ${videoId}`);

            console.log('\n📋 Step 5: Check Video Status');
            console.log('⏳ Starting...');

            // Check initial video status
            const status = await sdk.getVideoStatus(videoId);
            console.log('📊 Initial Video Status:', status);

            console.log('\n📋 Step 6: Monitor Processing Status');
            console.log('⏳ Starting...');

            // Subscribe to status updates
            const subscription = sdk.subscribeToVideoStatus(videoId, (status: any) => {
                console.log(`📊 Status Update: ${status.status}`);
                if (status.progress) {
                    console.log(`📊 Progress: ${status.progress}%`);
                }

                if (status.status === 'ready' || status.status === 'error') {
                    console.log('🏁 Processing completed');
                    subscription.unsubscribe();
                }
            });

            console.log(`\n💡 Video ID: ${videoId}`);
            console.log('💡 You can use this Video ID to mint NFT when processing is complete');

        } catch (error: any) {
            if (error.message.includes('uploadVideo')) {
                console.log('ℹ️  Note: Video upload might require API configuration');
                console.log('ℹ️  This is a demonstration of the video upload workflow');
                console.log('ℹ️  In production, ensure API endpoint and key are properly configured');
            } else {
                throw error;
            }
        }

    } catch (error: any) {
        console.error('\n❌ Video Upload failed:');
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
uploadVideo().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 