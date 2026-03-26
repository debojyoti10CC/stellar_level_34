# MicroFund | Decentralized Crowdfunding Platform 🚀

MicroFund is a Web3 Mini dApp that allows users to create fundraising campaigns and receive micro-donations using custom blockchain-based tokens (**MicroToken**). Built on the Stellar network using Soroban smart contracts, MicroFund ensures transparency, security, and real-time updates through a premium, glassmorphism-inspired UI.

![MicroFund Preview](https://via.placeholder.com/800x400/0f172a/6366f1?text=MicroFund+dApp+v1.0)

## 🎯 Features
- **Campaign Management**: Create, view, and track crowdfunding projects.
- **MicroToken System**: A custom token used for all decentralized donations.
- **Inter-Contract Logic**: Integration between Fundraiser and Token contracts.
- **Progress Tracking**: Real-time progress bars and donation history.
- **Secure Withdrawals**: Funds can only be withdrawn by creators when goals are met or deadlines passed.
- **Premium UI**: Dark mode, glassmorphism, and smooth animations using Framer Motion.
- **CI/CD Integrated**: Automated testing and build validation via GitHub Actions.

## 🛠️ Tech Stack
- **Smart Contracts**: Rust & Soroban (Stellar)
- **Frontend**: React, Vite, Vanilla CSS
- **Wallet**: Freighter (Stellar Wallets Kit)
- **Icons & Animations**: Lucide-React, Framer Motion
- **Dev Tools**: Stellar CLI, Cargo

## 📦 Project Structure
```text
stellar3/
├── contracts/
│   ├── fundraiser/     # Fundraiser contract (Campaigns, Donations)
│   └── token/          # MicroToken contract (Custom Token)
├── frontend/           # React application with Premium UI
├── .github/            # CI/CD Workflow
└── Cargo.toml          # Workspace configuration
```

## 🚀 Getting Started

### 🔗 Smart Contract Setup
1. **Prerequisites**: Install [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools) and Rust.
2. **Build Contracts**:
   ```powershell
   stellar contract build --package micro-token
   stellar contract build --package micro-fund
   ```
3. **Run Tests**:
   ```powershell
   cargo test
   ```

### 🖥️ Frontend Setup
1. **Navigate to frontend**:
   ```powershell
   cd frontend
   ```
2. **Install dependencies**:
   ```powershell
   npm install
   ```
3. **Run development server**:
   ```powershell
   npm run dev
   ```

## 🧪 Testing Results
![Tested Results](https://via.placeholder.com/600x200/22d3ee/ffffff?text=Tests+Passed:+3/3)

Successfully passed:
- `test_create_campaign`
- `test_initialize_and_mint`
- `test_transfer`

## 🎬 Demo Video
[Watch MicroFund Demo](https://vimeo.com/placeholder)

---
**MicroFund v1.0** — Built with ❤️ for the Stellar Ecosystem.

**Live Testnet Addresses:**
- **MicroToken**: `CAIAKTVEE6KHE7W33MNYX3AAJ4MRDY4LK7NOUG72K6UVL353QGKQNEXT`
- **MicroFund**: `CDMMACMOQKK5ELVLTMNMVD7ZJ5K63Y4SHJWLL4GMLGY2JMGFDNHQVFS7`
