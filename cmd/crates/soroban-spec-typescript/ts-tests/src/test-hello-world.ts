import test from 'ava'
import SorobanClient from 'soroban-client'
import { publicKey, rpcUrl, secretKey } from './const.js'
import { Address, Contract, networks } from 'test-hello-world'

const addr = Address.fromString(publicKey)

const contract = new Contract({
  ...networks.standalone,
  rpcUrl,
  wallet: {
    isConnected: () => Promise.resolve(true),
    isAllowed: () => Promise.resolve(true),
    getUserInfo: () => Promise.resolve({ publicKey }),
    signTransaction: async (tx: string, _opts?: {
      network?: string,
      networkPassphrase?: string,
      accountToSign?: string,
    }) => {
      const t = SorobanClient.TransactionBuilder.fromXDR(
        tx,
        networks.standalone.networkPassphrase,
      )
      const keypair = SorobanClient.Keypair.fromSecret(secretKey)
      t.sign(keypair)
      return t.toXDR()
    },
  },
})

test('hello', async t => {
  t.deepEqual(await contract.hello({ world: 'tests' }), ['Hello', 'tests'])
})

test('auth', async t => {
  t.is(await contract.auth({ addr, world: 'lol' }), addr)
})

test('inc', async t => {
  t.is(await contract.getCount(), 0)
  t.is(await contract.inc(), 1)
  t.is(await contract.getCount(), 1)
})
