import { Keypair } from 'soroban-client'

export const rpcUrl = 'http://localhost:8000/soroban/rpc'
export const secretKey = 'SC36BWNUOCZAO7DMEJNNKFV6BOTPJP7IG5PSHLUOLT6DZFRU3D3XGIXW'

const keypair = Keypair.fromSecret(secretKey)
export const publicKey = keypair.publicKey()
