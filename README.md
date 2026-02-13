# 🗳️ Civic Streak - Solana Hackathon Project

A **streak-based civic engagement system** on Solana blockchain. Users maintain daily streaks by completing civic actions (voting, reading issues, joining discussions).

---

## 🎯 Problem

Democratic platforms struggle with:
- Low user retention
- No incentive for daily engagement
- Centralized data manipulation risks

## 💡 Solution

Gamified streak system on Solana with:
- **Tamper-proof** engagement tracking (on-chain)
- **Daily streaks** with 24-48h window
- **Milestone rewards** (CIVIC_POINTS)

---

## ⛓️ Why Solana?

| Feature | Benefit |
|---------|---------|
| Speed | Near-instant transactions |
| Low Cost | Affordable micro-interactions |
| Tamper-proof | Immutable streak data |
| Verifiable | Anyone can verify on Explorer |

---

## ✨ Features

- **Wallet Auth** - Phantom/Solflare wallet
- **Streak Tracking** - 24-48h window, auto-reset
- **Civic Actions** - Vote, Read, Share, Discuss
- **Milestones** - 7, 14, 30, 50, 100 days
- **CIVIC_POINTS** - SPL token rewards

---

## 🏗️ Architecture

```
civic-streak/
├── programs/
│   └── civic-streak/src/lib.rs  # Anchor smart contract
├── frontend/
│   └── src/
│       ├── components/StreakComponent.tsx  # Main UI
│       ├── solana/client.ts    # Web3.js helpers
│       └── index.css           # Styling
├── Anchor.toml                 # Program config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Rust + Solana CLI + Anchor v0.32.1
- Node.js v18+
- Phantom/Solflare wallet

### 1. Start Local Validator
```bash
solana-test-validator
```

### 2. Build & Deploy Program
```bash
anchor build
anchor deploy
```

### 3. Configure Frontend
```bash
cd frontend
npm install
```

Update `.env`:
```env
VITE_SOLANA_RPC_ENDPOINT=http://localhost:8899
VITE_CIVIC_STREAK_PROGRAM_ID=YourDeployedProgramId
```

### 4. Run Frontend
```bash
npm run dev
```

Open `http://localhost:3000`

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `anchor build` | Build Rust program |
| `anchor deploy` | Deploy to network |
| `anchor test` | Run integration tests |
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build for production |

---

## 🌐 Networks

### Devnet (Current)
```
Program ID: 6uhm8dfJGi4yXzQJUshqCgyC1LzLwJvGCYpxvSSXQwT8
RPC: https://api.devnet.solana.com
```

### Local
```
RPC: http://localhost:8899
```

---

## 🎮 Usage Flow

1. **Connect Wallet** - Phantom/Solflare
2. **Start Streak** - Initialize account (Day 1)
3. **Daily Action** - Vote/Read/Share/Discuss
4. **Earn Points** - +10 points per action
5. **Hit Milestones** - Earn badges + bonus points

### Milestones
| Days | Badge | Points |
|------|-------|--------|
| 7 | 🌟 Civic Starter | 100 |
| 14 | ⭐ Active Citizen | 150 |
| 30 | 🏆 Civic Champion | 250 |
| 50 | 🎖️ Democracy Hero | 500 |
| 100 | 👑 Civic Legend | 1000 |

---

## 🔧 Tech Stack

- **Rust** + **Anchor Framework** (smart contract)
- **Solana web3.js** (frontend blockchain)
- **React** + **Vite** (UI)
- **Phantom Wallet Adapter**

---

## 📦 Key Files

| File | Purpose |
|------|---------|
| [`programs/civic-streak/src/lib.rs`](programs/civic-streak/src/lib.rs) | On-chain streak logic |
| [`frontend/src/solana/client.ts`](frontend/src/solana/client.ts) | Transaction helpers |
| [`frontend/src/components/StreakComponent.tsx`](frontend/src/components/StreakComponent.tsx) | Main UI component |
| [`frontend/src/index.css`](frontend/src/index.css) | Complete styling |

---

## 🧪 Testing

```bash
# Run Anchor tests
anchor test

# With verbose output
anchor test -v
```

---

## 📖 More Info

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Devnet/mainnet deployment
- Frontend: `http://localhost:3000`
- Explorer: `https://explorer.solana.com/?cluster=devnet`

---

## 🏆 Hackathon Notes

- **Simple & Clean** - Focused on core functionality
- **Real Working Code** - Tested on devnet
- **Beginner-Friendly** - Clear comments and structure
- **Extensible** - Easy to add NFTs, DAOs, voting

---

Built for the civic engagement hackathon 🚀
