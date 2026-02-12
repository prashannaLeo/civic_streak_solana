// Solana client helper for Civic Streak program
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { sha256 } from "@noble/hashes/sha256";

// Program ID - read from environment variable
const PROGRAM_ID = new PublicKey(
  typeof import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID === "string" &&
    import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    ? import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    : "9eVimSSosBbnjQmTjx7aGrKUo9ZJVmVEV7d6Li37Z526",
);

export interface UserStreakData {
  user: string;
  streakCount: number;
  lastInteractionTs: number;
  createdTs: number;
  milestoneClaimed: number;
}

export interface Milestone {
  days: number;
  name: string;
  icon: string;
  color: string;
}

export const MILESTONES: Milestone[] = [
  { days: 7, name: "Civic Starter", icon: "🌟", color: "#fbbf24" },
  { days: 14, name: "Consistent", icon: "⭐", color: "#60a5fa" },
  { days: 30, name: "Champion", icon: "🏆", color: "#a78bfa" },
];

// Derive instruction discriminators (first 8 bytes of sha256("global:<snake_case_name>"))
const getInstructionDiscriminator = (name: string): Buffer => {
  const preimage = new TextEncoder().encode(`global:${name}`);
  const hash = sha256.create().update(preimage).digest(); // Uint8Array(32)
  return Buffer.from(hash.slice(0, 8));
};

const DISC_INITIALIZE = getInstructionDiscriminator("initialize_user_streak");
const DISC_RECORD = getInstructionDiscriminator("record_daily_engagement");

const programPublicKey = new PublicKey(PROGRAM_ID);

// Get PDA for user streak account
export const getUserStreakPDA = (userPubkey: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("streak_v3"), userPubkey.toBuffer()],
    programPublicKey,
  );
  return pda;
};

// Build raw instruction
const buildInstruction = (
  userPubkey: PublicKey,
  discriminator: Buffer,
): TransactionInstruction => {
  const streakPDA = getUserStreakPDA(userPubkey);

  return new TransactionInstruction({
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: streakPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: programPublicKey,
    data: discriminator,
  });
};

// Initialize streak account (raw transaction, no Anchor Program client)
export const initializeStreak = async (
  connection: Connection,
  wallet: anchor.Wallet | any,
  userPubkey: PublicKey,
): Promise<string> => {
  const provider = new anchor.AnchorProvider(connection as any, wallet, {
    commitment: "confirmed",
  });

  const tx = new Transaction().add(
    buildInstruction(userPubkey, DISC_INITIALIZE),
  );

  const sig = await provider.sendAndConfirm(tx);
  return sig;
};

// Record daily engagement (raw transaction, no Anchor Program client)
export const recordDailyEngagement = async (
  connection: Connection,
  wallet: anchor.Wallet | any,
  userPubkey: PublicKey,
): Promise<string> => {
  const provider = new anchor.AnchorProvider(connection as any, wallet, {
    commitment: "confirmed",
  });

  const tx = new Transaction().add(buildInstruction(userPubkey, DISC_RECORD));

  const sig = await provider.sendAndConfirm(tx);
  return sig;
};

// Fetch streak data from blockchain
export const fetchStreakData = async (
  connection: Connection,
  userPubkey: PublicKey,
): Promise<UserStreakData | null> => {
  const streakPDA = getUserStreakPDA(userPubkey);
  const accountInfo = await connection.getAccountInfo(streakPDA);

  if (!accountInfo) {
    return null;
  }

  // Decode account data (first 8 bytes are discriminator)
  const data = accountInfo.data;
  const streakCount = Number(data.readBigUInt64LE(8));
  const lastInteractionTs = Number(data.readBigInt64LE(16));
  const createdTs = Number(data.readBigInt64LE(24));
  const milestoneClaimed = Number(data.readBigUInt64LE(32));

  return {
    user: userPubkey.toString(),
    streakCount,
    lastInteractionTs,
    createdTs,
    milestoneClaimed,
  };
};

// Confirm transaction
export const confirmTransaction = async (
  connection: Connection,
  signature: string,
): Promise<void> => {
  await connection.confirmTransaction(signature, "confirmed");
};
