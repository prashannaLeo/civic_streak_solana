## Civic Streak Frontend / Program Integration – Debug Notes

### Current Configuration

**PDA Seed:** `streak_v3`
**Program ID Source:** Only from `frontend/.env` (`VITE_CIVIC_STREAK_PROGRAM_ID`)

### Key Files

1. **Rust (`programs/civic-streak/src/lib.rs`):**
   ```rust
   const STREAK_SEED: &[u8] = b"streak_v3";
   declare_id!("AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu");
   ```

2. **Frontend (`frontend/src/solana/client.ts`):**
   - Uses `anchor.Program` with IDL
   - Seed: `Buffer.from("streak_v3")`
   - Program ID from `.env` only (`VITE_CIVIC_STREAK_PROGRAM_ID`)
   - Uses `anchor.web3.PublicKey` consistently to avoid `_bn` errors

3. **Frontend (`frontend/.env`):**
   ```
   VITE_CIVIC_STREAK_PROGRAM_ID=<your_program_id>
   ```

### Program ID Management

**Only edit `frontend/.env`:**
```
VITE_CIVIC_STREAK_PROGRAM_ID=<paste_solana_playground_program_id_here>
```

No need to change `idl.ts` or `client.ts` for program ID changes.

### Common Errors & Fixes

**`AccountDidNotDeserialize` (0xbbb / 3003):**
- Cause: PDA already exists with incompatible data
- Fix: Bump PDA seed (v2 → v3 → v4, etc.)

**`InstructionFallbackNotFound` (101):**
- Cause: Frontend instruction name doesn't match Rust (camelCase vs snake_case)
- Fix: Use Anchor Program class which handles this automatically

**`_bn` error:**
- Cause: Mixing different `@solana/web3.js` copies
- Fix: Use `anchor.web3.PublicKey` consistently

### Testing

```bash
cd frontend
npm run dev
```

### Deployment (Solana Playground)

1. Deploy program from Playground
2. Copy program ID to `frontend/.env`
3. Restart frontend
