import { createConnector } from '@lxdao/uploader3-connector'

export const logoTypeConfig = [
  'DeFi',
  'NFTs',
  'DID',
  'Wallet',
  'Plugin',
  'DAO',
  'SocialFi',
  'GameFi',
  'Public Chain',
  'Other',
]

export const connector = createConnector('NFT.storage', {
  token: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY || '',
})
