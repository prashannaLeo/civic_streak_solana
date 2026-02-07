# Civic Streak Frontend Integration Guide

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration

Make sure you have the following in your environment:

- **Program ID**: `3twLpAWhqJdrQJ52pEGjUXA9yiLRpGB9fnTa6knzALze` (from your deployed program)
- **Network**: Devnet (can be changed in `WalletProvider.tsx`)
- **Supported Wallets**: Phantom, Solflare

### 3. Running the Frontend

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

## How It Works

### Architecture

1. **WalletProvider** (`src/contexts/WalletProvider.tsx`)
   - Sets up Solana wallet connections
   - Configures network (Devnet)
   - Provides wallet context to all components

2. **Solana Client** (`src/solana/client.ts`)
   - Initializes Anchor program
   - Defines program methods and PDAs
   - Handles all on-chain interactions

3. **useCivicStreak Hook** (`src/hooks/useCivicStreak.ts`)
   - React hook for streak interactions
   - Methods: `initializeStreak()`, `recordEngagement()`, `fetchStreakData()`
   - Manages loading and error states

4. **StreakComponent** (`src/components/StreakComponent.tsx`)
   - UI for user interactions
   - Displays streak data
   - Buttons to initialize and record daily actions

### Key Methods

#### Initialize Streak
```typescript
const tx = await initializeStreak();
```
- Creates a new streak account for the user
- Seeds: `["streak", user_pubkey]`

#### Record Daily Engagement
```typescript
const tx = await recordEngagement();
```
- Records a daily civic action
- Maintains or resets streak based on time window
- Updates last interaction timestamp

#### Fetch Streak Data
```typescript
const data = await fetchStreakData();
```
- Retrieves current streak information
- Returns: count, timestamps, milestone status

## Frontend-Program Connection Flow

```
User → Wallet Connect → Program Interaction → Solana Devnet
         ↓                        ↓
    Phantom/Solflare      Sign & Submit Tx
         ↓                        ↓
    Account Data ←────────── On-Chain State
```

## Important Notes

1. **IDL File**: The IDL (Interface Definition Language) is required for Anchor.js to interact with your program
   - Located at: `target/idl/civic_streak.json`
   - Describes all instructions and accounts

2. **PDA Derivation**: User streak accounts are derived using:
   ```
   [STREAK_SEED ("streak"), user_pubkey]
   ```
   - Same derivation on frontend and program ensures consistency

3. **Error Handling**: All errors are caught and displayed to the user
   - Program errors (e.g., "Already claimed today")
   - Network errors (e.g., transaction failed)

4. **Wallet Signing**: All transactions require wallet signature
   - Users will see approval dialog in their wallet
   - Transactions are submitted to Devnet

## Testing

1. Connect a Devnet-funded wallet (use [faucet](https://faucet.solana.com))
2. Click "Initialize Streak" to create your account
3. Click "Record Daily Action" after 24 hours to maintain streak
4. View your streak count and interaction history

## Troubleshooting

### "Wallet not connected"
- Ensure wallet is installed (Phantom/Solflare)
- Click "Select Wallet" and approve connection

### "Transaction failed"
- Check you have SOL for gas fees (~0.00002 SOL)
- Verify program is deployed at correct address
- Check network is set to Devnet

### "No IDL found"
- Ensure `target/idl/civic_streak.json` exists
- Path should be relative to public folder

## Production Deployment

To deploy to production (Mainnet):
1. Update network in `WalletProvider.tsx`: `clusterApiUrl("mainnet-beta")`
2. Update Program ID if redeployed
3. Rebuild: `npm run build`
4. Deploy to hosting (Vercel, Netlify, etc.)
