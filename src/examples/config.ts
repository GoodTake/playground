// Configuration for GoTake SDK examples
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper function to ensure private key has proper format
function formatPrivateKey(key: string): string {
    if (!key) return key;
    // Remove any whitespace
    key = key.trim();
    // Add 0x prefix if missing
    if (!key.startsWith('0x')) {
        return '0x' + key;
    }
    return key;
}

export const config = {
    // Network configuration - SDK will use Base Sepolia as default if not specified
    network: process.env.NETWORK || 'Base Sepolia',

    // Private key for signing transactions - ensure proper format
    // WARNING: Never use plaintext private keys in production code
    privateKey: formatPrivateKey(process.env.PRIVATE_KEY || ''),
};

// Validate required configuration
if (!config.privateKey) {
    console.warn('Warning: PRIVATE_KEY not set in environment variables');
    console.warn('Please set PRIVATE_KEY in your .env file');
} 