import { useState } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Shield, User, Search, Clock, Eye, Check, X, Loader2 } from 'lucide-react'

interface PermissionManagerProps {
    sdk: GoTakeSDK
}

interface PermissionResult {
    contentId: number
    hasPermission: boolean
    remainingViews: number
    purchaseTime?: Date
    isExpired: boolean
    userAddress?: string
}

interface OperationStatus {
    loading: boolean
    success: boolean
    error: string | null
}

export function PermissionManager({ sdk }: PermissionManagerProps) {
    // User permission check state
    const [userForm, setUserForm] = useState({
        userAddress: '',
        contentIds: ''
    })
    const [userResults, setUserResults] = useState<PermissionResult[]>([])
    const [userStatus, setUserStatus] = useState<OperationStatus>({
        loading: false,
        success: false,
        error: null
    })

    // My permissions state
    const [myContentIds, setMyContentIds] = useState('')
    const [myResults, setMyResults] = useState<PermissionResult[]>([])
    const [myStatus, setMyStatus] = useState<OperationStatus>({
        loading: false,
        success: false,
        error: null
    })

    // Single content check state
    const [singleForm, setSingleForm] = useState({
        userAddress: '',
        contentId: ''
    })
    const [singleResult, setSingleResult] = useState<PermissionResult | null>(null)
    const [singleStatus, setSingleStatus] = useState<OperationStatus>({
        loading: false,
        success: false,
        error: null
    })

    // Check user permissions function
    const checkUserPermissions = async () => {
        setUserStatus({ loading: true, success: false, error: null })

        try {
            if (!userForm.userAddress.trim() || !userForm.contentIds.trim()) {
                throw new Error('Both user address and content IDs are required')
            }

            const contentIds = userForm.contentIds
                .split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id))

            if (contentIds.length === 0) {
                throw new Error('Please provide valid content IDs separated by commas')
            }

            const results: PermissionResult[] = []

            for (const contentId of contentIds) {
                try {
                    const hasPermission = await sdk.videoPayment.userHasViewPermission(
                        userForm.userAddress,
                        contentId
                    )

                    let remainingViews = 0
                    let purchaseTime: Date | undefined
                    let isExpired = true

                    if (hasPermission) {
                        const permissions = await sdk.videoPayment.getUserPermissions(
                            userForm.userAddress,
                            contentId
                        )
                        remainingViews = permissions.remainingViews.toNumber()
                        purchaseTime = new Date(permissions.purchaseTime.toNumber() * 1000)
                        isExpired = !permissions.isValid
                    }

                    results.push({
                        contentId,
                        hasPermission,
                        remainingViews,
                        purchaseTime,
                        isExpired,
                        userAddress: userForm.userAddress
                    })
                } catch (error) {
                    results.push({
                        contentId,
                        hasPermission: false,
                        remainingViews: 0,
                        isExpired: true,
                        userAddress: userForm.userAddress
                    })
                }
            }

            setUserResults(results)
            setUserStatus({ loading: false, success: true, error: null })

        } catch (error) {
            setUserStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check user permissions'
            })
        }
    }

    // Check my permissions function
    const checkMyPermissions = async () => {
        setMyStatus({ loading: true, success: false, error: null })

        try {
            if (!myContentIds.trim()) {
                throw new Error('Content IDs are required')
            }

            const contentIds = myContentIds
                .split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id))

            if (contentIds.length === 0) {
                throw new Error('Please provide valid content IDs separated by commas')
            }

            const results: PermissionResult[] = []

            for (const contentId of contentIds) {
                try {
                    const hasPermission = await sdk.videoPayment.hasViewPermission(contentId)

                    let remainingViews = 0
                    let purchaseTime: Date | undefined
                    let isExpired = true

                    if (hasPermission) {
                        const permissions = await sdk.videoPayment.getMyPermissions(contentId)
                        remainingViews = permissions.remainingViews.toNumber()
                        purchaseTime = new Date(permissions.purchaseTime.toNumber() * 1000)
                        isExpired = !permissions.isValid
                    }

                    results.push({
                        contentId,
                        hasPermission,
                        remainingViews,
                        purchaseTime,
                        isExpired
                    })
                } catch (error) {
                    results.push({
                        contentId,
                        hasPermission: false,
                        remainingViews: 0,
                        isExpired: true
                    })
                }
            }

            setMyResults(results)
            setMyStatus({ loading: false, success: true, error: null })

        } catch (error) {
            setMyStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check my permissions'
            })
        }
    }

    // Check single content permission function
    const checkSinglePermission = async () => {
        setSingleStatus({ loading: true, success: false, error: null })

        try {
            if (!singleForm.contentId.trim()) {
                throw new Error('Content ID is required')
            }

            const contentId = parseInt(singleForm.contentId)
            if (isNaN(contentId)) {
                throw new Error('Please provide a valid content ID')
            }

            let hasPermission: boolean
            let remainingViews = 0
            let purchaseTime: Date | undefined
            let isExpired = true

            if (singleForm.userAddress.trim()) {
                // Check specific user permission
                hasPermission = await sdk.videoPayment.userHasViewPermission(
                    singleForm.userAddress,
                    contentId
                )

                if (hasPermission) {
                    const permissions = await sdk.videoPayment.getUserPermissions(
                        singleForm.userAddress,
                        contentId
                    )
                    remainingViews = permissions.remainingViews.toNumber()
                    purchaseTime = new Date(permissions.purchaseTime.toNumber() * 1000)
                    isExpired = !permissions.isValid
                }
            } else {
                // Check my permission
                hasPermission = await sdk.videoPayment.hasViewPermission(contentId)

                if (hasPermission) {
                    const permissions = await sdk.videoPayment.getMyPermissions(contentId)
                    remainingViews = permissions.remainingViews.toNumber()
                    purchaseTime = new Date(permissions.purchaseTime.toNumber() * 1000)
                    isExpired = !permissions.isValid
                }
            }

            const result: PermissionResult = {
                contentId,
                hasPermission,
                remainingViews,
                purchaseTime,
                isExpired,
                userAddress: singleForm.userAddress || undefined
            }

            setSingleResult(result)
            setSingleStatus({ loading: false, success: true, error: null })

        } catch (error) {
            setSingleStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check permission'
            })
            setSingleResult(null)
        }
    }

    // Reset functions
    const resetUserStatus = () => {
        setUserStatus({ loading: false, success: false, error: null })
        setUserResults([])
    }

    const resetMyStatus = () => {
        setMyStatus({ loading: false, success: false, error: null })
        setMyResults([])
    }

    const resetSingleStatus = () => {
        setSingleStatus({ loading: false, success: false, error: null })
        setSingleResult(null)
    }

    // Helper function to format permission results table
    const PermissionTable = ({ results }: { results: PermissionResult[] }) => (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Content ID</th>
                        {results[0]?.userAddress && (
                            <th className="border border-gray-300 px-4 py-2 text-left">User</th>
                        )}
                        <th className="border border-gray-300 px-4 py-2 text-left">Permission</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Views Left</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Purchase Time</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((result) => (
                        <tr key={`${result.contentId}-${result.userAddress || 'self'}`}>
                            <td className="border border-gray-300 px-4 py-2">{result.contentId}</td>
                            {results[0]?.userAddress && (
                                <td className="border border-gray-300 px-4 py-2 text-sm">
                                    {result.userAddress?.slice(0, 6)}...{result.userAddress?.slice(-4)}
                                </td>
                            )}
                            <td className="border border-gray-300 px-4 py-2">
                                {result.hasPermission ? (
                                    <span className="flex items-center text-green-600">
                                        <Check className="h-4 w-4 mr-1" />
                                        Granted
                                    </span>
                                ) : (
                                    <span className="flex items-center text-red-600">
                                        <X className="h-4 w-4 mr-1" />
                                        Denied
                                    </span>
                                )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                                {result.hasPermission ? result.remainingViews : '-'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-sm">
                                {result.purchaseTime ? result.purchaseTime.toLocaleString() : '-'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                                {!result.hasPermission ? (
                                    <span className="text-gray-500">No Access</span>
                                ) : result.isExpired ? (
                                    <span className="flex items-center text-red-600">
                                        <Clock className="h-4 w-4 mr-1" />
                                        Expired
                                    </span>
                                ) : (
                                    <span className="flex items-center text-green-600">
                                        <Eye className="h-4 w-4 mr-1" />
                                        Active
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Permission Manager</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Check viewing permissions and access rights for content</p>
            </div>

            {/* Check User Permissions Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Check User Permissions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                User Address
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0x..."
                                value={userForm.userAddress}
                                onChange={(e) => setUserForm({ ...userForm, userAddress: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Content IDs (comma separated)
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1,2,3,4"
                                value={userForm.contentIds}
                                onChange={(e) => setUserForm({ ...userForm, contentIds: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={checkUserPermissions}
                        disabled={userStatus.loading}
                        className="w-full"
                    >
                        {userStatus.loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4 mr-2" />
                                Check User Permissions
                            </>
                        )}
                    </Button>

                    {/* User Status */}
                    {userStatus.error && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <span className="text-red-700 dark:text-red-300">{userStatus.error}</span>
                            </div>
                            <button onClick={resetUserStatus} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* User Results */}
                    {userResults.length > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Permission Results</h4>
                            <PermissionTable results={userResults} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Check My Permissions Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Check My Permissions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Content IDs (comma separated)
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1,2,3,4"
                            value={myContentIds}
                            onChange={(e) => setMyContentIds(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={checkMyPermissions}
                        disabled={myStatus.loading}
                        className="w-full"
                    >
                        {myStatus.loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4 mr-2" />
                                Check My Permissions
                            </>
                        )}
                    </Button>

                    {/* My Status */}
                    {myStatus.error && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <span className="text-red-700 dark:text-red-300">{myStatus.error}</span>
                            </div>
                            <button onClick={resetMyStatus} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* My Results */}
                    {myResults.length > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">My Permission Results</h4>
                            <PermissionTable results={myResults} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Single Content Check Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Single Content Permission Check
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Content ID
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1"
                                value={singleForm.contentId}
                                onChange={(e) => setSingleForm({ ...singleForm, contentId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                User Address (optional - leave empty for your own)
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0x... (optional)"
                                value={singleForm.userAddress}
                                onChange={(e) => setSingleForm({ ...singleForm, userAddress: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={checkSinglePermission}
                        disabled={singleStatus.loading}
                        className="w-full"
                    >
                        {singleStatus.loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4 mr-2" />
                                Check Permission
                            </>
                        )}
                    </Button>

                    {/* Single Status */}
                    {singleStatus.error && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <span className="text-red-700 dark:text-red-300">{singleStatus.error}</span>
                            </div>
                            <button onClick={resetSingleStatus} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Single Result */}
                    {singleResult && (
                        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md p-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Permission Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Content ID:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{singleResult.contentId}</p>
                                </div>
                                {singleResult.userAddress && (
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">User Address:</span>
                                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                            {singleResult.userAddress.slice(0, 10)}...{singleResult.userAddress.slice(-6)}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Permission Status:</span>
                                    <p className={`font-medium ${singleResult.hasPermission ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {singleResult.hasPermission ? (
                                            <span className="flex items-center">
                                                <Check className="h-4 w-4 mr-1" />
                                                Granted
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                <X className="h-4 w-4 mr-1" />
                                                Denied
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Remaining Views:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {singleResult.hasPermission ? singleResult.remainingViews : 'N/A'}
                                    </p>
                                </div>
                                {singleResult.purchaseTime && (
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Purchase Time:</span>
                                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{singleResult.purchaseTime.toLocaleString()}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Access Status:</span>
                                    <p className={`font-medium ${!singleResult.hasPermission ? 'text-gray-500 dark:text-gray-400' : singleResult.isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {!singleResult.hasPermission ? (
                                            'No Access'
                                        ) : singleResult.isExpired ? (
                                            <span className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                Expired
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                <Eye className="h-4 w-4 mr-1" />
                                                Active
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 