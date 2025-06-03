// Common utility functions for GoTake SDK examples
import { GoTakeSDK } from '@gotake/gotake-sdk';
import { config } from './config';

/**
 * Initialize SDK with proper error handling
 */
export async function initializeSDK(): Promise<GoTakeSDK> {
    try {
        // Create SDK instance with all required parameters
        const sdk = new GoTakeSDK({
            network: config.network,
            signer: config.privateKey
        });

        // Verify connection by getting user address
        const address = await sdk.getAddress();
        console.log(`✅ SDK initialized successfully`);
        console.log(`📍 Connected to network: ${config.network}`);
        console.log(`👤 User address: ${address}`);

        return sdk;
    } catch (error) {
        console.error('❌ Failed to initialize SDK:', error);
        throw error;
    }
}

/**
 * Format and display transaction result
 */
export function displayTransactionResult(
    operation: string,
    txHash: string,
    additionalInfo?: Record<string, any>
): void {
    console.log(`\n🎉 ${operation} completed successfully!`);
    console.log(`📝 Transaction hash: ${txHash}`);

    if (additionalInfo) {
        Object.entries(additionalInfo).forEach(([key, value]) => {
            console.log(`📊 ${key}: ${value}`);
        });
    }
}

/**
 * Format error messages consistently
 */
export function displayError(operation: string, error: any): void {
    console.error(`\n❌ ${operation} failed:`);
    if (error.message) {
        console.error(`💬 Error: ${error.message}`);
    }
    if (error.code) {
        console.error(`🔢 Code: ${error.code}`);
    }
}

/**
 * Validate environment setup
 */
export function validateEnvironment(): boolean {
    if (!config.privateKey) {
        console.error('❌ Missing PRIVATE_KEY in environment variables');
        console.error('📋 Please copy .env.example to .env and set your private key');
        return false;
    }

    return true;
}

/**
 * Wait for user confirmation (for demonstration purposes)
 */
export function displayStep(stepNumber: number, description: string): void {
    console.log(`\n📋 Step ${stepNumber}: ${description}`);
    console.log('⏳ Starting...');
} 