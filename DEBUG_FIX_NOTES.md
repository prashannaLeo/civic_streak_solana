## Civic Streak Frontend / Program Integration – Debug Notes

### 1. Original issues

- **Anchor `Program` misuse & constructor overload confusion**
  - We initially called `new Program(civicStreakIdl, provider, PROGRAM_ID)` which mismatched the expected argument order.
  - This caused Anchor to treat the provider object as the program ID, leading to a runtime error inside `@solana/web3.js`:
    - `TypeError: Cannot read properties of undefined (reading '_bn')` coming from `new PublicKey(...)`.
- **Manual discriminators with wrong names**
  - We briefly replaced Anchor with a hand-crafted `TransactionInstruction` path using hard-coded discriminators derived from camelCase names:
    - Used `initializeUserStreak` / `recordDailyEngagement`.
  - On-chain program functions in `programs/civic-streak/src/lib.rs` are snake_case:
    - `initialize_user_streak`, `record_daily_engagement`.
  - This mismatch produced Anchor error code **101 – InstructionFallbackNotFound** (“Fallback functions are not supported”) on Solscan.
- **WalletSendTransactionError: Unexpected error**
  - The manual instruction path also skipped Anchor’s account constraints (e.g. `init` for `user_streak`), causing transaction simulation to fail in Phantom and surface only as a generic `WalletSendTransactionError: Unexpected error`.

### 2. Final, working approach

We reverted to **using Anchor’s TypeScript client properly** and removed the fragile manual-instruction layer.

**Key decisions:**

- Use `@coral-xyz/anchor` `Program` with the **correct constructor order** and types.
- Reuse the same PDA seeds as the Rust program (`b"streak", user.key().as_ref()`).
- Let Anchor handle:
  - Instruction discriminators,
  - Account serialization,
  - PDA creation (`init` constraint on `user_streak`),
  - Rent-exempt allocation.

### 3. Important frontend changes (`frontend/src/components/StreakComponent.tsx`)

1. **Imports**
   - Switched from raw web3-only flow back to Anchor:
   - **Before (manual flow):**
     - `import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";`
     - Manual discriminators / `TransactionInstruction`.
   - **After (Anchor flow):**
     - `import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";`
     - `import { PublicKey, SystemProgram } from "@solana/web3.js";`
     - `import { Program, AnchorProvider } from "@coral-xyz/anchor";`
     - `import { civicStreakIdl } from "../solana/idl";`

2. **Program ID and PDA**
   - Program ID stays:
     - `declare_id!("9eVimSSosBbnjQmTjx7aGrKUo9ZJVmVEV7d6Li37Z526");` in Rust.
     - `PROGRAM_ID` as `new PublicKey(...)` in TS.
   - PDA helper matches Rust:
     - `seeds = [b"streak", user.key().as_ref()]` in Rust.
     - `PublicKey.findProgramAddressSync([Buffer.from("streak"), userPublicKey.toBuffer()], PROGRAM_ID)` in TS.

3. **Fix for `_bn` error (mixed PublicKey classes)**

The `_bn` error can occur when different copies of `@solana/web3.js` are involved and Anchor tries to convert a `PublicKey` instance from one copy using another copy’s constructor.

To avoid this, we now **pass the program ID as a base58 string** to Anchor’s `Program` constructor:

- **Before:**
  - `new Program(civicStreakIdl as any, PROGRAM_ID, provider);`
- **After:**
  - `new Program(civicStreakIdl as any, PROGRAM_ID.toString(), provider);`

Anchor then constructs its own `PublicKey` internally from the string, preventing `_bn` from being read on an incompatible object.

4. **Initialization flow (`initializeStreak`)**

- Guard on wallet + Anchor wallet:
  - Require both `publicKey` and `anchorWallet` before proceeding.
- Verify program exists with `connection.getAccountInfo(PROGRAM_ID)`.
- Compute `streakPDA` using the shared helper.
- **Short‑circuit if account exists**:
  - Calls `fetchStreakData()` and shows `"📊 Streak account already exists!"`.
- Construct Anchor provider:
  - `new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" })`.
- Construct program with program ID as **string** (see above).
- Call Anchor methods:
  - `program.methods.initializeUserStreak().accounts({ user, userStreak, systemProgram }).rpc({ commitment: "confirmed" })`.
- Confirm transaction, refresh streak data, show `"🎉 Streak account created!"`.

5. **Daily engagement flow (`recordDailyEngagement`)**

- Same provider/program pattern as initialization.
- Use:
  - `program.methods.recordDailyEngagement().accounts({ user, userStreak, systemProgram }).rpc();`
- On success:
  - Confirm transaction, refresh streak data, show `"🔥 Streak: X days!"`.
- On failure:
  - If message includes `"already claimed"`, surface a friendly `"⏰ You've already claimed today!"` message.

### 4. Things to avoid going forward

- **Do NOT hand‑craft instruction discriminators** for Anchor programs unless absolutely necessary.
  - Always prefer `program.methods.<fn>()` which uses the IDL.
- **Do NOT change `Program` constructor argument order**:
  - Should be `(idl, programId, provider?)`.
- **Avoid passing `PublicKey` instances between different `@solana/web3.js` versions/copies**:
  - When in doubt, pass `programId.toString()` (base58) into libraries that may bundle their own `PublicKey` class.
- **Centralize PDA seed logic**:
  - PDA seeds used in Rust (`STREAK_SEED`) and TS must always stay in sync.

### 5. AccountDidNotDeserialize (0xbbb / 3003) – PDA seed bump

- **Symptom:** `AnchorError caused by account: user_streak. Error Code: AccountDidNotDeserialize`.
- **Cause:** An account already existed at the streak PDA with data that didn't match the current `UserStreak` layout (e.g. from an older program version or partial init).
- **Fix applied:** Bumped PDA seed from `streak_v2` to `streak_v3` so the program uses a **new** PDA with no prior state:
  - **Rust** (`programs/civic-streak/src/lib.rs`): `const STREAK_SEED: &[u8] = b"streak_v3";`
  - **Frontend** (`frontend/src/solana/client.ts`): `Buffer.from("streak_v3")` in `getUserStreakPDA`.
- **After changing the seed:** Run `anchor build` and `anchor deploy --provider.cluster devnet`, then restart the frontend.

Keeping these notes up to date should prevent us from re‑introducing the `_bn` error or the fallback‑instruction error in future refactors.

