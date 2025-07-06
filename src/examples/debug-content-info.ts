import { ethers } from 'ethers'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
    const RPC_URL = process.env.RPC_URL
    console.log(RPC_URL)
    if (!RPC_URL) {
        console.error('RPC_URL environment variable is not set')
        return
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

    let signer: ethers.Signer
    const pk = process.env.PRIVATE_KEY
    if (pk) {
        signer = new ethers.Wallet(pk, provider)
    } else {
        signer = provider.getSigner()
    }

    const sdk = new GoTakeSDK({ provider, signer })
    await sdk.videoPayment.init()

    const contentId = 8888
    const info = await sdk.videoPayment.getContentInfo(contentId)
    console.log(info)
    console.log(`Content ID: ${contentId}`)
    console.log(`Native Price (wei): ${info.nativePrice.toString()}`)
    console.log(`Native Price (ETH): ${ethers.utils.formatEther(info.nativePrice)}`)
    console.log(`View Count: ${info.viewCount}`)
    console.log(`Is Active: ${info.isActive}`)

    console.log('Token Prices:')
    for (const [token, price] of Object.entries(info.tokenPrices)) {
        console.log(`  ${token}: ${price.toString()} wei | ${ethers.utils.formatEther(price)} units`)
    }
}

main().catch((err) => {
    console.error(`Error occurred: ${err}`)
}) 