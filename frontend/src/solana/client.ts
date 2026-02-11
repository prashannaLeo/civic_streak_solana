// Solana client helper for Civic Streak program - using Anchor Program class
import {
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { civicStreakIdl } from "./idl";

// Program ID - only from .env (VITE_CIVIC_STREAK_PROGRAM_ID)
const PROGRAM_ID = (import.meta as any)?.env?.VITE_CIVIC_STREAK_PROGRAM_ID;

if (!PROGRAM_ID) {
  throw new Error(
    "Missing VITE_CIVIC_STREAK_PROGRAM_ID in frontend/.env"
  );
}

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

// Create Anchor Program instance
const getProgram = (
  connection: Connection,
  wallet: anchor.Wallet | any
): anchor.Program => {
  // Use anchor's bundled web3 for PublicKey to avoid _bn errors
  const anchorConnection = new anchor.web3.Connection(
    connection.rpcEndpoint,
    "confirmed"
  );
  
  const provider = new anchor.AnchorProvider(
    anchorConnection,
    wallet,
    { commitment: "confirmed" }
  );

  // Create PublicKey using anchor's bundled class
  const programIdKey = new anchor.web3.PublicKey(PROGRAM_ID);

  // Create program with IDL - use 'any' to bypass strict type checking
  // Anchor Program constructor: (idl, programId, provider)
  return new (anchor.Program as any)(civicStreakIdl, programIdKey, provider);
};

// Get PDA for user streak account
export const getUserStreakPDA = (userPubkey: PublicKey): PublicKey => {
  // Use anchor's bundled PublicKey
  const anchorPublicKey = new anchor.web3.PublicKey(PROGRAM_ID);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("streak_v3"), userPubkey.toBuffer()],
    anchorPublicKey
  );
  return pda;
};

// Initialize streak account
export const initializeStreak = async (
  connection: Connection,
  wallet: anchor.Wallet | any,
  userPubkey: PublicKey
): Promise<string> => {
  const program = getProgram(connection, wallet);
  const streakPDA = getUserStreakPDA(userPubkey);

  const signature = await program.methods
    .initializeUserStreak()
    .accounts({
      user: userPubkey,
      userStreak: streakPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  return signature;
};

// Record daily engagement
export const recordDailyEngagement = async (
  connection: Connection,
  wallet: anchor.Wallet | any,
  userPubkey: PublicKey
): Promise<string> => {
  const program = getProgram(connection, wallet);
  const streakPDA = getUserStreakPDA(userPubkey);

  const signature = await program.methods
    .recordDailyEngagement()
    .accounts({
      user: userPubkey,
      userStreak: streakPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  return signature;
};

// Fetch streak data from blockchain
export const fetchStreakData = async (
  connection: Connection,
  userPubkey: PublicKey
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
  signature: string
): Promise<void> => {
  await connection.confirmTransaction(signature, "confirmed");
};
