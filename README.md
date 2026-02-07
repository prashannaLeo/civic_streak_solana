# 🏛️ Civic Streak V2 - NFT Badge Edition

A **streak-based civic engagement system** built on Solana blockchain with **soulbound NFT badges**.

This V2 update introduces **NFT badges** as permanent, verifiable proof of civic participation history.

---

## 🎖️ What's New in V2

### NFT Badge System

| Badge | Milestone | Rarity | Description |
|-------|-----------|--------|-------------|
| 🌟 Civic Starter | 7 days | Common | First step into civic engagement |
| 🏆 Consistent Citizen | 30 days | Rare | Month of dedication |
| 👑 Civic Champion | 100 days | Legendary | Ultimate civic achievement |

### Key Features

- **Soulbound NFTs** - Non-transferable, wallet-bound badges
- **Metaplex Metadata** - Standard-compliant, rich badge information
- **Public Verification** - Anyone can verify badges on Solana explorer
- **Progress Tracking** - Visual gallery showing earned and locked badges

---

## 📋 Table of Contents

- [The Problem](#the-problem)
- [Why Solana?](#why-solana)
- [Features](#features)
- [Badge System](#badge-system)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Testing](#testing)
- [Deployment](#deployment)
- [SPL Token Setup](#spl-token-setup)
- [NFT Badge Guide](./NFT_BADGES.md)

---

## 🚨 The Problem

In democratic systems like Nepal's civic platforms (e.g., Janmat), citizens often:
- **Lack consistent engagement** - Users visit once and never return
- **Miss important civic events** - No motivation to stay informed
- **Don't build civic habits** - Voting and civic participation should be daily, not episodic
- **Face centralization risks** - Centralized systems can manipulate engagement data

### Our Solution: Gamified Streak System

By combining **blockchain technology** with **behavioral psychology** (streak mechanics), we create:
- ✅ **Tamper-proof engagement tracking** - All data verified on Solana
- ✅ **Incentivized participation** - Rewards for consistent civic engagement
- ✅ **Community building** - Milestones create shared goals

---

## ⛓️ Why Solana?

| Feature | Benefit for Civic Engagement |
|---------|----------------------------|
| **Speed** | Near-instant transaction confirmation |
| **Low Cost** | Affordable for daily micro-interactions |
| **Tamper-proof** | Immutable streak data on-chain |
| **Verifiable** | Anyone can verify engagement claims |
| **Decentralized** | No single point of control or manipulation |

### How Solana is Used

1. **Streak Accounts (PDAs)** - Each user has a Program-Derived Address storing their streak data
2. **SPL Tokens** - CIVIC_POINTS as non-transferable rewards
3. **Smart Contracts** - Anchor-based program enforces streak rules
4. **Timestamp Verification** - On-chain clock ensures fair streak calculations

---

## ✨ Features

### 🔐 Wallet Authentication
- Phantom wallet integration
- User identity = wallet address
- Secure, non-custodial login

### 📅 Streak System
- **24-48 hour window** to maintain streak
- Automatic reset if window missed
- PDA-stored data prevents tampering

### 🏆 NFT Badge System (V2)
- **Soulbound NFTs** - Cannot be transferred
- **Milestone-based** - Earn badges at key streaks
- **Public verification** - View on Solana Explorer
- **Rich metadata** - Full achievement details

| Badge | Requirement | Rarity |
|-------|-------------|--------|
| 🌟 Civic Starter | 7-day streak | Common |
| 🏆 Consistent Citizen | 30-day streak | Rare |
| 👑 Civic Champion | 100-day streak | Legendary |

### 🎯 Civic Actions
- Vote on polls
- Read issue summaries
- Acknowledge national topics

### 💰 SPL Token (CIVIC_POINTS)
- Non-transferable rewards
- Earned through milestone achievements
- 7 days → 100 points
- 30 days → 250 points
- 100 days → 500 points

---

## 📁 Project Structure

```
civic-streak/
├── programs/
│   └── civic-streak/
│       ├── Cargo.toml
│       ├── Xargo.toml
│       └── src/
│           └── lib.rs          # Main Anchor program
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # Main React app with wallet
│       └── index.css           # Styling
├── tests/
│   └── civic-streak.ts         # Integration tests
├── migrations/
├── Anchor.toml                 # Anchor configuration
├── Cargo.toml                  # Workspace config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Rust** (latest stable) - `rustup install stable`
- **Solana CLI** - `sh -c "$(curl -sSf https://solana.com/install)"``
- **Anchor** - `cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 --locked`
- **Node.js** (v18+) - for frontend
- **Phantom Wallet** - browser extension

### Installation

```bash
# 1. Clone and enter directory
cd civic-streak

# 2. Install Rust dependencies
cd programs/civic-streak
cargo build

# 3. Install frontend dependencies
cd ../../frontend
npm install

# 4. Configure Solana for local testing
solana config set --url localhost

# 5. Generate a keypair for testing
solana-keygen new -o ~/.config/solana/id.json
```

---

## 🛠️ Setup Instructions

### Step 1: Start Local Solana Cluster

```bash
# Start a local validator (in separate terminal)
solana-test-validator
```

### Step 2: Build and Deploy the Program

```bash
# Navigate to project root
cd civic-streak

# Build the Anchor program
anchor build

# Deploy to localnet
anchor deploy
```

### Step 3: Update Program ID

After deployment, update the program ID in:
- `Anchor.toml` - `programs.localnet.civic_streak`
- `programs/civic-streak/src/lib.rs` - `declare_id!()`

### Step 4: Create SPL Token

```bash
# Create the token mint
spl-token create-token

# Create a token account for yourself
spl-token create-account <TOKEN_MINT_ADDRESS>

# Mint some tokens to your account
spl-token mint <TOKEN_MINT_ADDRESS> 10000
```

### Step 5: Update Frontend Config

In `frontend/src/App.tsx`, update:
```typescript
const PROGRAM_ID = new PublicKey('YourDeployedProgramId');
const TOKEN_MINT = new PublicKey('YourTokenMintAddress');
```

### Step 6: Run Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Testing

### Run Anchor Tests

```bash
anchor test
```

### Run Specific Test File

```bash
anchor test --skip-build
```

### Test with Detailed Output

```bash
anchor test --skip-build -v
```

### Example Test Case

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { CivicStreak } from '../target/types/civic_streak';

describe('civic-streak', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.CivicStreak as Program<CivicStreak>;

  it('initializes user streak', async () => {
    const user = anchor.web3.Keypair.generate();
    
    const tx = await program.methods
      .initializeUserStreak()
      .accounts({
        user: user.publicKey,
        userStreak: getStreakPda(user.publicKey),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
    console.log('Transaction signature', tx);
  });
});
```

---

## 📦 Deployment

### Devnet Deployment

```bash
# Configure for devnet
solana config set --url devnet

# Generate deploy keypair
solana-keygen new -o deploy-key.json

# Airdrop some SOL for testing
solana airdrop 2

# Build and deploy
anchor build
anchor deploy --provider.cluster devnet
```

### Update Frontend for Devnet

In `frontend/src/App.tsx`:
```typescript
const endpoint = 'https://api.devnet.solana.com';
```

### Mainnet Deployment (Production)

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Build release
anchor build --arch bpf

# Deploy (requires sufficient SOL)
anchor deploy --provider.cluster mainnet-beta
```

### Verify Deployment

```bash
# Check program info
solana program show <PROGRAM_ID>
```

---

## 💰 SPL Token Setup

### Create Token

```bash
# Install SPL Token CLI
cargo install spl-token-cli

# Create token (9 decimals for CIVIC_POINTS)
spl-token create-token --decimals 9

# Note the mint address
```

### Configure Token for Rewards

1. **Mint Authority** - The program PDA should be the mint authority
2. **Freeze Authority** - Optionally disable to prevent token freezing
3. **Initial Supply** - Mint tokens to a stake vault controlled by program

### Program PDA for Mint Authority

```rust
// Seeds: [b"mint"]
const [mint_authority_pda, _bump] = Pubkey::find_program_address(
    &[b"mint"],
    program_id
);
```

### Stake Vault Setup

Create a token account owned by the program to hold rewards:
```bash
spl-token create-account <TOKEN_MINT_ADDRESS> --owner <PROGRAM_ID>
```

---

## 🎮 User Flow

### For End Users

1. **Connect Wallet** - Click "Connect Phantom" button
2. **Create Account** - First-time users initialize their streak
3. **Daily Actions** - Choose a civic action each day
4. **Earn Rewards** - Automatically receive points on milestones
5. **Track Progress** - View streak count, points, and milestones

### For Developers

```typescript
// Connect to program
const program = new Program(IDL, PROGRAM_ID);

// Get user streak PDA
const [streakPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('streak'), userPubkey.toBuffer()],
    PROGRAM_ID
);

// Initialize (first time only)
await program.methods.initializeUserStake().accounts({...}).rpc();

// Record daily engagement
await program.methods.recordDailyEngagement().accounts({...}).rpc();

// Claim milestone
await program.methods.claimMilestone(new BN(7)).accounts({...}).rpc();
```

---

## 🔧 Troubleshooting

### Common Issues

**"Program not found"**
```bash
# Ensure local validator is running
solana-test-validator

# Check config
solana config get
```

**"Insufficient lamports"**
```bash
# Airdrop to your wallet
solana airdrop 2
```

**"Build failed"**
```bash
# Clean and rebuild
anchor clean
anchor build
```

**"Wallet not connected"**
```bash
# Check Phantom extension
# Refresh page
# Try different browser
```

### Get Help

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Discord](https://solana.com/discord)

---

## 📄 License

MIT License - Feel free to use and modify for your hackathon!

---

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first.

---

**Built with ❤️ for better civic engagement**

🌐 **The Problem:** Low citizen participation in democratic processes  
💡 **The Solution:** Gamified blockchain-based engagement system  
⛓️ **The Platform:** Solana for speed, security, and decentralization
