# 🗳️ Civic Streak - Community Engagement Platform

A **streak-based civic engagement system** built on the Solana blockchain. Civic Streak rewards community members for consistent participation through a transparent, verifiable, and gamified experience. Users maintain daily streaks by completing civic actions such as voting, reading issues, and joining discussions.

---

## 🎯 The Problem

Democratic platforms and community organizations face significant challenges:

- **Low User Retention**: Users often lose interest after initial engagement
- **No Incentive for Daily Engagement**:缺乏持续的参与激励机制
- **Centralized Data Manipulation Risks**: 中心化数据存在被篡改的风险
- **Lack of Transparency**: 参与者难以验证他们的贡献是否被正确记录

## 💡 Our Solution

Civic Streak addresses these challenges with a gamified streak system built on Solana:

- **Tamper-Proof Engagement Tracking**: 所有参与记录都存储在 Solana 区块链上，完全透明且不可篡改
- **Daily Streaks with Flexible Window**: 24-48小时窗口期，允许用户在一天内完成操作
- **Milestone Rewards**: 达到里程碑时获得徽章和 CIVIC 积分奖励
- **Verifiable on-Chain**: 任何人都可以通过 Solana Explorer 验证参与记录

---

## ⛓️ Why Solana?

| Feature | Benefit |
|---------|---------|
| High Speed | Near-instant transaction confirmation |
| Low Cost | Affordable micro-interactions (~$0.001 per tx) |
| Tamper-Proof | Immutable streak data that cannot be altered |
| Verifiable | Anyone can verify participation on Explorer |
| Eco-Friendly | Proof of Stake consensus with minimal energy consumption |

---

## ✨ Features

- **Wallet Authentication** - Support for Phantom, Solflare, and Backpack wallets
- **Streak Tracking** - 24-48 hour window with automatic reset
- **Civic Actions** - Vote, Read, Share, Discuss, and more
- **Milestone Badges** - 7, 14, 30, 50, 100 day achievements
- **CIVIC Points** - SPL token rewards for consistent participation
- **Blockchain Verification** - All data stored on Solana for transparency

### Available Badges

| Badge | Requirement | Description |
|-------|-------------|-------------|
| 🌟 Civic Starter | 7 days | Your first milestone |
| 🏛️ Civic Citizen | 30 days | Dedicated community member |
| 👑 Civic Champion | 100 days | Legendary participant |

---

## 🏗️ Project Architecture

```
civic-streak/
├── programs/
│   └── civic-streak/src/lib.rs      # Anchor smart contract
├── frontend/
│   └── src/
│       ├── App.tsx                   # Main app with routing
│       ├── components/
│       │   ├── StreakComponent.tsx   # Main streak UI
│       │   ├── About.tsx             # About page
│       │   └── HowItWorks.tsx        # How it works page
│       ├── solana/
│       │   └── client.ts             # Web3.js helpers
│       └── index.css                 # Styling
├── Anchor.toml                       # Program configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Rust and Solana CLI installed
- Anchor Framework v0.32.1 or higher
- Node.js v18 or higher
- Phantom, Solflare, or Backpack wallet

### Quick Start

#### 1. Start Local Validator

```bash
solana-test-validator
```

#### 2. Build & Deploy Program

```bash
anchor build
anchor deploy
```

#### 3. Configure Frontend

```bash
cd frontend
npm install
```

Update your `.env` file:

```env
VITE_SOLANA_RPC_ENDPOINT=http://localhost:8899
VITE_CIVIC_STREAK_PROGRAM_ID=YourDeployedProgramId
```

#### 4. Run Frontend

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `anchor build` | Build the Rust program |
| `anchor deploy` | Deploy to the selected network |
| `anchor test` | Run integration tests |
| `npm run dev` | Start frontend development server |
| `npm run build` | Build frontend for production |

---

## 🌐 Network Configuration

### Devnet (Current)

```
Program ID: AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu
RPC Endpoint: https://api.devnet.solana.com
```

### Local Development

```
RPC Endpoint: http://localhost:8899
```

---

## 🎮 How to Use

1. **Connect Your Wallet** - Click the wallet button and connect using Phantom or Solflare
2. **Initialize Your Profile** - Create your Civic Streak profile on the blockchain
3. **Perform Daily Actions** - Vote, read, share, or discuss community topics
4. **Earn Points** - Receive +10 CIVIC points per action
5. **Reach Milestones** - Earn badges and bonus points at 7, 14, 30, 50, and 100 days

### Points System

| Action | Points |
|--------|--------|
| Daily Check-in | +5 |
| Vote | +10 |
| Read Article | +10 |
| Share Content | +10 |
| Join Discussion | +15 |

---

## 🔧 Technology Stack

### Backend
- **Rust** - Programming language for Solana programs
- **Anchor Framework** - Framework for building Solana dApps

### Frontend
- **React** - User interface library
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Solana Web3.js** - Blockchain interaction
- **Phantom Wallet Adapter** - Wallet integration

---

## 📦 Key Source Files

| File | Purpose |
|------|---------|
| [`programs/civic-streak/src/lib.rs`](programs/civic-streak/src/lib.rs) | On-chain streak logic and state management |
| [`frontend/src/solana/client.ts`](frontend/src/solana/client.ts) | Transaction helpers and program interaction |
| [`frontend/src/components/StreakComponent.tsx`](frontend/src/components/StreakComponent.tsx) | Main UI component for streak tracking |
| [`frontend/src/components/About.tsx`](frontend/src/components/About.tsx) | About page component |
| [`frontend/src/components/HowItWorks.tsx`](frontend/src/components/HowItWorks.tsx) | How it works guide page |
| [`frontend/src/index.css`](frontend/src/index.css) | Complete styling with civic theme |

---

## 🧪 Testing

Run the Anchor integration tests:

```bash
# Run all tests
anchor test

# Run with verbose output
anchor test -v

# Run specific test
anchor test --skip-localnet
```

---

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete devnet and mainnet deployment instructions
- Frontend: `http://localhost:3000`
- Solana Explorer: `https://explorer.solana.com/?cluster=devnet`

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request or open an Issue for:

- Bug fixes
- New features
- Documentation improvements
- UI/UX enhancements

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Solana Foundation for the incredible blockchain infrastructure
- Anchor team for the amazing development framework
- The open-source community for continuous inspiration

---

Built with ❤️ on Solana
