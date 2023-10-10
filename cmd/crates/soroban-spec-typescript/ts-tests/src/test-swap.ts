import test from "ava"
import { wallet, Wallet, rpcUrl, root, alice, networkPassphrase } from "./util.js"
import { Contract as Token } from "token"
import { Contract as Swap, networks, sendTx } from "test-swap"
import fs from "node:fs"
import {
  Address,
  Keypair,
  Operation,
  Server,
  SorobanRpc,
  StrKey,
  TransactionBuilder,
  assembleTransaction,
  hash,
  nativeToScVal,
  xdr,
} from 'soroban-client'

const tokenAId = fs.readFileSync(new URL("../contract-id-token-a.txt", import.meta.url), "utf8").trim()
const tokenBId = fs.readFileSync(new URL("../contract-id-token-b.txt", import.meta.url), "utf8").trim()
const swapId = fs.readFileSync(new URL("../contract-id-swap.txt", import.meta.url), "utf8").trim()

const tokenA = new Token({
  contractId: tokenAId,
  networkPassphrase,
  rpcUrl,
  wallet,
})
const tokenB = new Token({
  contractId: tokenBId,
  networkPassphrase,
  rpcUrl,
  wallet,
})
const swap = new Swap({ ...networks.standalone, rpcUrl, wallet })

const server = new Server(rpcUrl, {
  allowHttp: rpcUrl.startsWith("http://"),
})

test('root swaps alice 10 A for 1 B', async t => {
  // ensure some starting balance for each token
  await tokenA.mint({ to: root.keypair.publicKey(), amount: 100n })
  await tokenB.mint({ to: alice.keypair.publicKey(), amount: 100n })
  const { result: rootStartingABalance }  = await tokenA.balance({ id: root.keypair.publicKey() })
  const { result: rootStartingBBalance }  = await tokenB.balance({ id: root.keypair.publicKey() })
  const { result: aliceStartingABalance } = await tokenA.balance({ id: alice.keypair.publicKey() })
  const { result: aliceStartingBBalance } = await tokenB.balance({ id: alice.keypair.publicKey() })

  const amountAToSwap = 10n
  const amountBToSwap = 1n

  const { txUnsigned } = await swap.swap({
    a: root.keypair.publicKey(),
    b: alice.keypair.publicKey(),
    token_a: tokenAId,
    token_b: tokenBId,
    amount_a: amountAToSwap,
    min_a_for_b: amountAToSwap,
    amount_b: amountBToSwap,
    min_b_for_a: amountBToSwap,
  }, {
    responseType: 'simulated',
  })

  let tx = TransactionBuilder.fromXDR(
    txUnsigned,
    networkPassphrase
  )

  if (!("operations" in tx)) throw new Error('tx construction failed; no operations')

  const rawInvokeHostFunctionOp = tx
    .operations[0] as Operation.InvokeHostFunction

  const authEntries = rawInvokeHostFunctionOp.auth ?? []

  const signedAuthEntries = []

  for (const entry of authEntries) {
    if (
      // if the source account
      entry.credentials().switch() ===
      xdr.SorobanCredentialsType.sorobanCredentialsSourceAccount()
    ) {
      // …then the entry doesn't need explicit signature,
      // since the tx envelope is already signed by the source account
      signedAuthEntries.push(entry)
    } else {
      // else, the entry owner needs to sign
      const entryOwner = StrKey.encodeEd25519PublicKey(
        entry.credentials().address().address().accountId().ed25519()
      )
      t.is(entryOwner, alice.keypair.publicKey())

      // store a reference to the entry's auth info, which we mutate throughout this block
      const addrAuth = entry.credentials().address()

      // set auth entry to expire when contract data expires, but could do any number of blocks in the future
      const signatureExpirationLedger = await getStorageExpiration(swapId, 'persistent')
      addrAuth.signatureExpirationLedger(signatureExpirationLedger)

      const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
        new xdr.HashIdPreimageSorobanAuthorization({
          networkId: hash(Buffer.from(networkPassphrase)),
          nonce: addrAuth.nonce(),
          invocation: entry.rootInvocation(),
          signatureExpirationLedger,
        }),
      )
      const payload = hash(preimage.toXDR())
      const signature = alice.keypair.sign(payload)
      const publicKey = alice.keypair.publicKey()

      t.true(Keypair.fromPublicKey(publicKey).verify(payload, signature), "signature doesn't match payload")

      const sigScVal = nativeToScVal(
        {
          public_key: StrKey.decodeEd25519PublicKey(publicKey),
          signature,
        },
        {
          // force the keys to be interpreted as symbols (expected for
          // Soroban [contracttype]s)
          // Pr open to fix this type in the gen'd xdr
          type: {
            public_key: ["symbol", null],
            signature: ["symbol", null],
          },
        },
      )

      addrAuth.signature(xdr.ScVal.scvVec([sigScVal]))

      signedAuthEntries.push(entry)
    }
  }

  const builder = TransactionBuilder.cloneFrom(tx)
  builder.clearOperations().addOperation(
    Operation.invokeHostFunction({
      ...rawInvokeHostFunctionOp,
      auth: signedAuthEntries,
    }),
  )

  tx = builder.build()
  let txSim = await server.simulateTransaction(tx)

  if (!SorobanRpc.isSimulationSuccess(txSim)) {
    t.log('txSim', txSim)
    t.fail('txSim failed!')
  }
  txSim = txSim as SorobanRpc.SimulateTransactionSuccessResponse

  const finalTx = assembleTransaction(tx, networkPassphrase, txSim).build()
  finalTx.sign(root.keypair)
  const result = await sendTx(finalTx, 10, server)

  t.truthy(result.sendTransactionResponse, `tx failed: ${JSON.stringify(result)}`)
  t.true(result.sendTransactionResponse.status === 'PENDING', `tx failed: ${JSON.stringify(result)}`)
  t.truthy(result.getTransactionResponseAll?.length, `tx failed: ${JSON.stringify(result)}`)
  t.truthy(result.getTransactionResponse, `tx failed: ${JSON.stringify(result)}`)

  t.is((await tokenA.balance({ id: root.keypair.publicKey() })).result, rootStartingABalance - amountAToSwap)
  t.is((await tokenB.balance({ id: root.keypair.publicKey() })).result, rootStartingBBalance + amountBToSwap)
  t.is((await tokenA.balance({ id: alice.keypair.publicKey() })).result, aliceStartingABalance + amountAToSwap)
  t.is((await tokenB.balance({ id: alice.keypair.publicKey() })).result, aliceStartingBBalance - amountBToSwap)
})

async function getStorageExpiration(contractId: string, storageType: 'temporary' | 'persistent') {
  const key = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: new Address(contractId).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability[storageType](),
    }),
  )

  const expirationKey = xdr.LedgerKey.expiration(
    new xdr.LedgerKeyExpiration({ keyHash: hash(key.toXDR()) }),
  )

  // Fetch the current contract ledger seq
  // eslint-disable-next-line no-await-in-loop
  const entryRes = await server.getLedgerEntries(expirationKey)
  if (!(entryRes.entries && entryRes.entries.length)) throw new Error('failed to get ledger entry')

  const parsed = xdr.LedgerEntryData.fromXDR(
    entryRes.entries[0].xdr,
    "base64",
  )
  // set auth entry to expire when contract data expires, but could any number of blocks in the future
  return parsed.expiration().expirationLedgerSeq()
}
