import { 
    Account,
    TransactionBuilder,
    Address, 
    Contract, 
    Networks, 
    rpc, 
    scValToNative,
    nativeToScVal,
} from '@stellar/stellar-sdk';
import { requestAccess, signTransaction } from '@stellar/freighter-api';

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Newly deployed fundraiser contract (uses native XLM)
export const FUNDRAISER_CONTRACT_ID = "CDEJRTP2JFJYI6S2BO2FWL55XIIVHJDFS65PNKYILLG4CEVX2PWUPD3Z";

// Native XLM SAC on Stellar testnet
export const XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// 1 XLM = 10,000,000 stroops (Soroban uses stroops internally)
export const STROOPS_PER_XLM = 10_000_000n;
export const toStroops  = (xlm)    => BigInt(Math.round(Number(xlm) * 10_000_000));
export const toXLM      = (stroops) => Number(BigInt(stroops)) / 10_000_000;

const server = new rpc.Server(RPC_URL);

// Soroban structs come back from scValToNative as JS Map objects with symbol keys.
function mapToObj(val) {
    if (val instanceof Map) {
        const obj = {};
        for (const [k, v] of val.entries()) obj[String(k)] = mapToObj(v);
        return obj;
    }
    if (Array.isArray(val)) return val.map(mapToObj);
    return val;
}

// Mandatory Soroban flow: build → simulate → assemble → sign → send → poll
async function simulateAndSend(tx) {
    const simResult = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(simResult)) {
        console.error("Simulation failed:", simResult);
        throw new Error('Simulation failed: ' + (simResult.error ?? JSON.stringify(simResult)));
    }
    const assembled = rpc.assembleTransaction(tx, simResult).build();
    const { signedTxXdr } = await signTransaction(assembled.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const sendResult = await server.sendTransaction(signedTx);
    if (sendResult.status === 'ERROR') {
        throw new Error('Send failed: ' + JSON.stringify(sendResult.errorResult));
    }
    return await waitForConfirmation(sendResult.hash);
}

async function waitForConfirmation(hash) {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const status = await server.getTransaction(hash);
        if (status.status === rpc.Api.GetTransactionStatus.SUCCESS) return status;
        if (status.status === rpc.Api.GetTransactionStatus.FAILED) {
            throw new Error('Transaction failed on-chain');
        }
    }
    throw new Error('Transaction confirmation timed out after 30s');
}

export async function getPublicKey() {
    try {
        const { address } = await requestAccess();
        return address;
    } catch (e) {
        console.error("Wallet connection failed:", e);
        throw e;
    }
}

// Read XLM balance of an address via the native XLM SAC (returns XLM, not stroops)
export async function getXLMBalance(userAddress) {
    try {
        const contract = new Contract(XLM_SAC);
        const tx = new TransactionBuilder(
            new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
            { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
        )
        .addOperation(contract.call("balance",
            Address.fromString(userAddress).toScVal()
        ))
        .setTimeout(30)
        .build();

        const sim = await server.simulateTransaction(tx);
        if (rpc.Api.isSimulationSuccess(sim)) {
            const stroops = scValToNative(sim.result.retval);
            return toXLM(stroops);
        }
    } catch (e) {
        console.error("XLM balance fetch failed:", e);
    }
    return null;
}

export async function createCampaign(creator, title, description, goalXLM, deadline) {
    const contract = new Contract(FUNDRAISER_CONTRACT_ID);
    const account = await server.getAccount(creator);

    const tx = new TransactionBuilder(account, { 
        fee: "10000", 
        networkPassphrase: NETWORK_PASSPHRASE 
    })
    .addOperation(contract.call("create_campaign", 
        Address.fromString(creator).toScVal(),
        nativeToScVal(title, {type: 'string'}),
        nativeToScVal(description, {type: 'string'}),
        nativeToScVal(toStroops(goalXLM), {type: 'i128'}),
        nativeToScVal(BigInt(deadline), {type: 'u64'})
    ))
    .setTimeout(180)
    .build();

    return await simulateAndSend(tx);
}

export async function donate(donor, campaign_id, xlmAmount) {
    const contract = new Contract(FUNDRAISER_CONTRACT_ID);
    const account = await server.getAccount(donor);

    const tx = new TransactionBuilder(account, { 
        fee: "10000", 
        networkPassphrase: NETWORK_PASSPHRASE 
    })
    .addOperation(contract.call("donate", 
        Address.fromString(donor).toScVal(),
        nativeToScVal(campaign_id, {type: 'u32'}),
        nativeToScVal(toStroops(xlmAmount), {type: 'i128'})
    ))
    .setTimeout(180)
    .build();

    return await simulateAndSend(tx);
}

export async function withdraw(creator, campaign_id) {
    const contract = new Contract(FUNDRAISER_CONTRACT_ID);
    const account = await server.getAccount(creator);

    const tx = new TransactionBuilder(account, { 
        fee: "10000", 
        networkPassphrase: NETWORK_PASSPHRASE 
    })
    .addOperation(contract.call("withdraw", 
        nativeToScVal(campaign_id, {type: 'u32'})
    ))
    .setTimeout(180)
    .build();

    return await simulateAndSend(tx);
}

export async function fetchCampaigns() {
    try {
        const contract = new Contract(FUNDRAISER_CONTRACT_ID);
        const tx = new TransactionBuilder(
            new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
            { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
        )
        .addOperation(contract.call("get_campaigns"))
        .setTimeout(30)
        .build();

        const simulateResult = await server.simulateTransaction(tx);

        if (rpc.Api.isSimulationSuccess(simulateResult)) {
            const raw = scValToNative(simulateResult.result.retval);
            return (Array.isArray(raw) ? raw : []).map(item => {
                const c = mapToObj(item);
                return {
                    id:            Number(c.id),
                    creator:       String(c.creator),
                    title:         String(c.title),
                    description:   String(c.description),
                    // Convert stroops → XLM for display
                    goal:          toXLM(BigInt(c.goal)),
                    amount_raised: toXLM(BigInt(c.amount_raised)),
                    deadline:      Number(c.deadline),
                    withdrawn:     Boolean(c.withdrawn),
                };
            });
        } else {
            console.error("Simulation failed:", simulateResult);
        }
    } catch (e) {
        console.error("Network fetch failed:", e);
    }
    return [];
}
