# MicroFund | Decentralized XLM Crowdfunding 

https://stellar-level-34.vercel.app/

MicroFund is a Web3 Mini dApp built directly on the **Stellar Testnet** using Soroban smart contracts. It enables users to launch secure fundraising campaigns and seamlessly accept micro-donations in **native XLM**. 

With a premium glassmorphic UI, it ensures complete transparency: campaigns are strictly bound by their on-chain goals and deadlines, and creators can only withdraw funds once those fully trustless conditions are met.

##  Key Features
- **Native XLM Integration**: Complete shift to the native Stellar Asset Contract (SAC). No need for custom tokens; donations and goals are denominated purely in XLM.
- **Trustless Escrow**: The smart contract acts as an escrow. The funds sit securely on-chain until the goal is met or the deadline has passed.
- **Creator Withdrawals**: Creators can extract their XLM instantly once conditions are met.
- **Live Data Polling**: Real-time integration with the Stellar Testnet using Freighter API and `@stellar/stellar-sdk`.
- **Premium UI**: Modern dark mode, glassmorphism aesthetics, responsive campaign grids, dynamic progress bars, and beautifully animated toast notifications.

##  Tech Stack
- **Smart Contracts**: Rust & Soroban (Stellar)
- **Frontend**: React, Vite, Vanilla CSS
- **Wallet**: Freighter (Stellar browser extension)
- **Icons**: Lucide-React
- **Dev Tools**: Stellar CLI, rustc


---
https://youtu.be/0XcUFu0G8JI

##  Live Contract & Addresses (Stellar Testnet)

- **MicroFund Contract ID:** `CDEJRTP2JFJYI6S2BO2FWL55XIIVHJDFS65PNKYILLG4CEVX2PWUPD3Z`
- **Native XLM SAC Address:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

*(You can explore these addresses on any Stellar Testnet explorer like [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDEJRTP2JFJYI6S2BO2FWL55XIIVHJDFS65PNKYILLG4CEVX2PWUPD3Z))*

---

##  Workflows: How to Use the DApp

### 1. Connect & Get XLM
* You must have the [Freighter Wallet](https://www.freighter.app/) extension installed in your browser.
* Switch Freighter to the **Testnet** network.
* Get free Testnet XLM directly from the [Stellar Friendbot](https://friendbot.stellar.org/).
* Click **Connect Wallet** in the DApp to read your live XLM balance from the chain.

### 2. Launch a Campaign
* Click **Start a campaign**.
* Provide a **Title**, **Description**, **Funding Goal (in XLM)**, and a **Deadline** (must be a future date).
* Freighter will pop up. Sign the transaction.
* Wait ~5 seconds for the Stellar ledger to close. Your campaign is instantly live on-chain!

### 3. Support a Project
* Browse active campaigns.
* Click **Support** on any active project. (You cannot support your own withdrawn projects or expired ones).
* Enter the amount of XLM you wish to push. You will be warned if it exceeds your balance.
* Sign the transaction. The contract pulls XLM from your wallet directly into the campaign's on-chain balance.

### 4. Withdraw Funds (Creators Only)
* If your campaign hits 100% of its goal **OR** the deadline passes, a **Withdraw** button will appear on your card.
* Click **Withdraw**, sign the transaction, and the smart contract will automatically send all collected XLM to your wallet.
* The campaign will be marked as "Withdrawn" forever.

---

##  Developer Setup: Running Locally

### 1. Smart Contract Deployment (Optional)
If you wish to deploy your own instance of the MicroFund contract:
```bash
# Build the contract
stellar contract build

# Assume you have an account named 'default' funded on testnet
stellar contract deploy --wasm target/wasm32v1-none/release/micro_fund.wasm --network testnet --source-account default

# Initialize the new contract by passing the Native XLM SAC address
stellar contract invoke --id <YOUR_NEW_CONTRACT_ID> --network testnet --source-account default -- initialize --xlm_sac CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

### 2. Run the React Frontend
```bash
cd frontend

# Install Dependencies
npm install

# Start Local Dev Server
npm run dev
```

##  Deployment to Vercel/Netlify

To make your frontend live to the world:
1. Import your GitHub repository to Vercel.
2. Under "Framework Preset", ensure **Vite** is selected.
3. Under "Root Directory", click edit and type **`frontend`** (this is critically important).
4. Deploy! Your DApp is now live.

---

