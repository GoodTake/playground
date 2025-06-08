export interface TBAInfo {
    address: string
    chainId: number
    tokenContract: string
    tokenId: string
    isValidSigner: boolean
    balance: string
}

export interface NFTMetadata {
    title: string
    description: string
    creator: string
    tags: string[]
    image?: string
}

export interface IPNFTDetails {
    tokenId: string
    title: string
    description: string
    owner: string
    creator: string
    tokenURI: string
}

export interface WalletInfo {
    address: string
    balance: string
    chainId: number
    isConnected: boolean
}

export interface AppState {
    wallet: WalletInfo | null
    tbas: TBAInfo[]
    nfts: IPNFTDetails[]
    loading: boolean
    error: string | null
}

export type AppAction =
    | { type: 'SET_WALLET'; payload: WalletInfo }
    | { type: 'SET_TBAS'; payload: TBAInfo[] }
    | { type: 'SET_NFTS'; payload: IPNFTDetails[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET' } 