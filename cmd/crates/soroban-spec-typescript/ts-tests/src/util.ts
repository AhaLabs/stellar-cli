import { spawnSync } from "node:child_process";
import { Keypair, TransactionBuilder } from "soroban-client";
import { Address } from 'test-custom-types'

const rootKeypair = Keypair.fromSecret(spawnSync("./soroban", ["config", "identity", "show"], { shell: true, encoding: "utf8" }).stdout.trim());
const aliceKeypair = Keypair.fromSecret(spawnSync("./soroban", ["config", "identity", "show", "alice"], { shell: true, encoding: "utf8" }).stdout.trim());

export const root = {
  keypair: rootKeypair,
  address: Address.fromString(rootKeypair.publicKey()),
}

export const alice = {
  keypair: aliceKeypair,
  address: Address.fromString(aliceKeypair.publicKey()),
}

export const rpcUrl = process.env.SOROBAN_RPC_URL ?? "http://localhost:8000/";
export const networkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE ?? "Standalone Network ; February 2017";

export class Wallet {
  constructor(private publicKey: string) {}
  isConnected = () => Promise.resolve(true)
  isAllowed = () => Promise.resolve(true)
  getUserInfo = () => Promise.resolve({ publicKey: this.publicKey })
  signTransaction = async (
    tx: string,
    _opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ) => {
    const t = TransactionBuilder.fromXDR(tx, networkPassphrase);
    const accountToSign = {
      [root.keypair.publicKey()]: root.keypair.secret(),
      [alice.keypair.publicKey()]: alice.keypair.secret(),
    }[(await this.getUserInfo()).publicKey];
    const keypair = Keypair.fromSecret(accountToSign);
    t.sign(keypair);
    return t.toXDR();
  }
}

export const wallet = new Wallet(root.keypair.publicKey())
