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
    network: string
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

// Video Payment Types
export interface VideoPaymentResult {
    transactionHash: string
    contentId: number
}

export interface ContentPermission {
    remainingViews: number
    purchaseTime: Date
    isValid: boolean
}

export interface PermissionData {
    contentId: number
    hasPermission: boolean
    remainingViews?: number
    purchaseTime?: Date
    isValid?: boolean
}

export interface ContentConfig {
    contentId: number
    nativePrice: string
    defaultViewCount: number
    viewDuration: number
    isActive: boolean
}

// Multi-currency content configuration interfaces
export interface MultiCurrencyContentConfig {
    contentId: number
    nativePrice: string  // ETH price
    tokenPrices?: Record<string, string>  // ERC20 token price mapping
    defaultViewCount: number
    viewDuration: number
    isActive: boolean
}

export interface BatchMultiCurrencyConfig {
    contentIds: number[]
    nativePrices: string[]
    tokenPricesArray?: Record<string, string>[]  // Token prices for each content
    defaultViewCounts: number[]
    viewDurations: number[]
    isActiveArray: boolean[]
}

// Payment method detection interfaces
export interface DetectedPaymentMethod {
    type: 'ETH' | 'ERC20'
    label: string
    price: string
    tokenAddress?: string
}

export interface PaymentOptions {
    contentId: number
    availableMethods: DetectedPaymentMethod[]
    recommendedMethod?: DetectedPaymentMethod
}

// SDK Raw Types (what SDK actually returns)
export interface SDKContentInfo {
    contentId: number
    isActive: boolean
    defaultViewCount: number
    viewDuration: number
    nativePrice: any  // BigNumber from SDK
    tokenPrices: Record<string, any>  // BigNumber values from SDK
}

export interface SDKPermissions {
    purchaseTime: any  // BigNumber from SDK
    remainingViews: any  // BigNumber from SDK
    isValid: boolean
}

export interface SDKPurchaseResult {
    transactionHash: string
}

export interface BatchContentConfig {
    contentIds: number[]
    nativePrices: string[]
    defaultViewCounts: number[]
    viewDurations: number[]
    isActiveArray: boolean[]
}

// Payment Method Types
export type PaymentMethod = 'ETH' | 'ERC20'

// Status Types
export interface ActionStatus {
    status: 'idle' | 'processing' | 'success' | 'error'
    txHash?: string
    error?: string
}

export interface PurchaseStatus extends ActionStatus {
    contentId?: number
}

export interface BatchPurchaseStatus extends ActionStatus {
    contentIds?: number[]
    successCount?: number
}

export interface CheckStatus {
    status: 'idle' | 'checking' | 'success' | 'error'
    error?: string
}

// Navigation Types
export interface NavigationItem {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    description?: string
}

export interface NavigationGroup {
    title: string
    items: NavigationItem[]
}

// Component Props Types
export interface VideoPurchaserProps {
    sdk: any // GoTakeSDK type
    address: string
}

export interface PermissionManagerProps {
    sdk: any // GoTakeSDK type
    address: string
}

export interface ContentManagerProps {
    sdk: any // GoTakeSDK type
    address: string
}

export interface NavigationProps {
    activeItem: string
    onItemChange: (itemId: string) => void
}

// Permission Checking Types
export interface PermissionSummary {
    contentId: number
    hasPermission: boolean
    purchaseTime?: Date
    remainingViews: number
    isExpired: boolean
    contentInfo?: ContentInfoData
}

export interface PermissionCheckState {
    status: 'idle' | 'checking' | 'success' | 'error'
    operation?: 'user' | 'single' | 'analyze'
    results?: PermissionSummary[]
    analysisData?: UserEngagementData
    error?: string
}

export interface UserEngagementData {
    totalPurchases: number
    activePurchases: number
    expiredPurchases: number
    totalViewsRemaining: number
    retentionRate: number
    averageViewsPerPurchase: number
}

// Content Management Types
export interface ContentSummary {
    contentId: number
    status: 'Available' | 'Inactive' | 'Error'
    priceETH?: string
    viewCount?: number
    duration?: number
    isActive?: boolean
    error?: string
}

export interface ContentManagementState {
    status: 'idle' | 'processing' | 'success' | 'error'
    operation?: 'create' | 'update' | 'batch' | 'list' | 'report'
    result?: any
    contentList?: ContentSummary[]
    error?: string
}

export interface ContentConfig {
    contentId: number
    priceETH: string
    viewCount: number
    durationHours: number
    isActive: boolean
}

// Purchase Center Types
export interface ContentInfoData {
    contentId: number
    isActive: boolean
    defaultViewCount: number
    viewDuration: number
    nativePrice: string
    tokenPrices: Record<string, string>
    userHasAccess?: boolean
    userPermissions?: UserPermissions
}

export interface UserPermissions {
    remainingViews: number
    purchaseTime: Date
    isValid: boolean
    validUntil?: Date
}

export interface PurchaseState {
    status: 'idle' | 'processing' | 'success' | 'error'
    operation?: 'single' | 'batch' | 'check'
    result?: PurchaseResult
    contentInfo?: ContentInfoData
    paymentOptions?: PaymentOptions
    batchResults?: BatchPurchaseResult
    error?: string
}

export interface PurchaseResult {
    transactionHash: string
    contentId: number
    success?: boolean
}

export interface BatchPurchaseResult {
    transactionHash: string
    contentIds: number[]
    successCount: number
    totalCount: number
    successRate: number
} 