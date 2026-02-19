# Civic Streak Program - Deployment Guide

## Quick Deployment (Anchor Playground)

### Step 1: Access Anchor Playground
1. Go to https://beta.anchor-lang.com
2. Click "Import Project" and select your GitHub repo or upload files

### Step 2: Deploy to Devnet
1. Connect Phantom wallet with devnet SOL
2. Run `anchor deploy` in the Playground terminal
3. Program ID: `AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu`

### Step 3: Export IDL
After deployment, run:
```bash
anchor idl init --filepath ./target/idl/civic_streak.json AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu
```

### Step 4: Copy IDL Files
Copy the exported IDL to:
- `target/idl/civic_streak.json`
- `frontend/src/solana/idl.ts`

### Step 5: Update Frontend Environment
Verify `.env` has:
```
VITE_CIVIC_STREAK_PROGRAM_ID=AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu
```

### Step 6: Test Deployment
1. Check program on Solana Explorer: https://explorer.solana.com/address/AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu?cluster=devnet
2. Click "Instructions" tab - should show 3 instructions
3. Run frontend: `cd frontend && npm run dev`
4. Connect Phantom wallet
5. Click "Initialize Streak Account"

## Local Deployment (with Anchor CLI)

If you have Anchor CLI installed:

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Export IDL
anchor idl export --filepath ./target/idl/civic_streak.json
```

## Discriminator Verification

The frontend uses these instruction discriminators (SHA-256 of "global:<instruction_name>", first 8 bytes):

- `initializeUserStreak`: Should match deployed program
- `recordDailyEngagement`: Should match deployed program
- `getUserStreak`: Should match deployed program

If you see `InstructionFallbackNotFound` (Error 101), the discriminators don't match. Re-deploy and export fresh IDL.

## Troubleshooting

### Error: InstructionFallbackNotFound
- Program code and IDL are out of sync
- Re-deploy the program
- Export fresh IDL after deployment

### Error: Account not found
- Program not deployed at expected address
- Check program ID in `.env`
- Verify program on Solana Explorer

### Transaction failed
- Check Phantom wallet for transaction details
- Ensure enough SOL for transaction fees
- Try with `skipPreflight: false` for detailed errors
