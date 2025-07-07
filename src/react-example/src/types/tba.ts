export interface AccountNFTInfo {
    tokenId: string;
    owner: string;
    tbaAddress: string;
    ethBalance: string;
    erc20Balances: Record<string, string>;
    accountInfo: {
        name: string;
        description: string;
        establishedAt: string;
    };
}

export interface CreateAccountStatus {
    status: 'idle' | 'creating' | 'success' | 'error';
    accountNFTTx?: string;
    tbaTx?: string;
    tokenId?: string;
    tbaAddress?: string;
    error?: string;
}

export interface TransferStatus {
    status: 'idle' | 'transferring' | 'success' | 'error';
    txHash?: string;
    error?: string;
}

export interface TransferForm {
    direction: 'EOA_TO_TBA' | 'TBA_TO_EOA';
    type: 'ETH' | 'ERC20';
    amount: string;
    selectedTBA: string;
    erc20Address: string;
} 