"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTx = exports.signTx = exports.invoke = exports.NotImplementedError = void 0;
const SorobanClient = require("soroban-client");
const soroban_client_1 = require("soroban-client");
/**
 * Get account details from the Soroban network for the publicKey currently
 * selected in Freighter. If not connected to Freighter, return null.
 */
async function getAccount(wallet, server) {
    if (!(await wallet.isConnected()) || !(await wallet.isAllowed())) {
        return null;
    }
    const { publicKey } = await wallet.getUserInfo();
    if (!publicKey) {
        return null;
    }
    return await server.getAccount(publicKey);
}
class NotImplementedError extends Error {
}
exports.NotImplementedError = NotImplementedError;
async function invoke({ method, args = [], fee = 100, responseType, parseResultXdr, secondsToWait = 10, rpcUrl, networkPassphrase, contractId, wallet, }) {
    wallet = wallet ?? (await Promise.resolve().then(() => require("@stellar/freighter-api")));
    let parse = parseResultXdr;
    const server = new SorobanClient.Server(rpcUrl, {
        allowHttp: rpcUrl.startsWith("http://"),
    });
    const walletAccount = await getAccount(wallet, server);
    // use a placeholder null account if not yet connected to Freighter so that view calls can still work
    const account = walletAccount ??
        new SorobanClient.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
    const contract = new SorobanClient.Contract(contractId);
    const txUnsigned = new SorobanClient.TransactionBuilder(account, {
        fee: fee.toString(10),
        networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(SorobanClient.TimeoutInfinite)
        .build();
    const simulation = await server.simulateTransaction(txUnsigned);
    if (soroban_client_1.SorobanRpc.isSimulationError(simulation)) {
        throw new Error(simulation.error);
    }
    else if (responseType === "simulated") {
        return { txUnsigned: txUnsigned.toXDR(), simulation };
    }
    else if (!simulation.result) {
        throw new Error(`invalid simulation: no result in ${simulation}`);
    }
    let authsCount = simulation.result.auth.length;
    const writeLength = simulation.transactionData.getReadWrite().length;
    const isViewCall = (authsCount === 0) && (writeLength === 0);
    if (isViewCall) {
        if (responseType === "full")
            return { txUnsigned: txUnsigned.toXDR(), simulation };
        return {
            txUnsigned: txUnsigned.toXDR(),
            simulation,
            result: parseResultXdr(simulation.result.retval),
        };
    }
    if (authsCount > 1) {
        throw new NotImplementedError("Multiple auths not yet supported");
    }
    if (authsCount === 1) {
        // TODO: figure out how to fix with new SorobanClient
        // const auth = SorobanClient.xdr.SorobanAuthorizationEntry.fromXDR(auths![0]!, 'base64')
        // if (auth.addressWithNonce() !== undefined) {
        //   throw new NotImplementedError(
        //     `This transaction needs to be signed by ${auth.addressWithNonce()
        //     }; Not yet supported`
        //   )
        // }
    }
    if (!walletAccount) {
        throw new Error("Not connected to Freighter");
    }
    const txSigned = await signTx(wallet, SorobanClient.assembleTransaction(txUnsigned, networkPassphrase, simulation).build(), networkPassphrase);
    const data = {
        simulation,
        txUnsigned: txUnsigned.toXDR(),
        txSigned: txSigned.toXDR(),
        ...await sendTx(txSigned, secondsToWait, server)
    };
    if (responseType === "full")
        return data;
    // if `sendTx` awaited the inclusion of the tx in the ledger, it used `getTransaction`
    if ("getTransactionResponse" in data &&
        data.getTransactionResponse) {
        // getTransactionResponse has a `returnValue` field unless it failed
        if ("returnValue" in data.getTransactionResponse)
            return {
                ...data,
                result: parse(data.getTransactionResponse.returnValue)
            };
        // if "returnValue" not present, the transaction failed; return without parsing the result
        console.error("Transaction failed! Cannot parse result.");
        return data;
    }
    // if it didn't await, it returned the result of `sendTransaction`
    return {
        ...data,
        result: parse(data.sendTransactionResponse.errorResultXdr),
    };
}
exports.invoke = invoke;
/**
 * Sign a transaction with Freighter and return the fully-reconstructed
 * transaction ready to send with {@link sendTx}.
 *
 * If you need to construct a transaction yourself rather than using `invoke`
 * or one of the exported contract methods, you may want to use this function
 * to sign the transaction with Freighter.
 */
async function signTx(wallet, tx, networkPassphrase) {
    const signed = await wallet.signTransaction(tx.toXDR(), {
        networkPassphrase,
    });
    return SorobanClient.TransactionBuilder.fromXDR(signed, networkPassphrase);
}
exports.signTx = signTx;
/**
 * Send a transaction to the Soroban network.
 *
 * Wait `secondsToWait` seconds for the transaction to complete (default: 10).
 * If you pass `0`, it will automatically return the `sendTransaction` results,
 * rather than using `getTransaction`.
 *
 * If you need to construct or sign a transaction yourself rather than using
 * `invoke` or one of the exported contract methods, you may want to use this
 * function for its timeout/`secondsToWait` logic, rather than implementing
 * your own.
 */
async function sendTx(tx, secondsToWait, server) {
    const sendTransactionResponse = await server.sendTransaction(tx);
    if (sendTransactionResponse.status !== "PENDING" || secondsToWait === 0) {
        return { sendTransactionResponse };
    }
    const getTransactionResponseAll = [];
    getTransactionResponseAll.push(await server.getTransaction(sendTransactionResponse.hash));
    const waitUntil = new Date(Date.now() + secondsToWait * 1000).valueOf();
    let waitTime = 1000;
    let exponentialFactor = 1.5;
    while (Date.now() < waitUntil &&
        getTransactionResponseAll[getTransactionResponseAll.length - 1].status === soroban_client_1.SorobanRpc.GetTransactionStatus.NOT_FOUND) {
        // Wait a beat
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        /// Exponential backoff
        waitTime = waitTime * exponentialFactor;
        // See if the transaction is complete
        getTransactionResponseAll.push(await server.getTransaction(sendTransactionResponse.hash));
    }
    if (getTransactionResponseAll[getTransactionResponseAll.length - 1].status === soroban_client_1.SorobanRpc.GetTransactionStatus.NOT_FOUND) {
        console.error(`Waited ${secondsToWait} seconds for transaction to complete, but it did not. ` +
            `Returning anyway. Check the transaction status manually. ` +
            `Info: ${JSON.stringify(sendTransactionResponse, null, 2)}`);
    }
    return {
        sendTransactionResponse,
        getTransactionResponseAll,
        getTransactionResponse: getTransactionResponseAll[getTransactionResponseAll.length - 1]
    };
}
exports.sendTx = sendTx;
