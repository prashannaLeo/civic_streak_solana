// Solana client helper for Civic Streak program - using web3.js directly
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { Buffer } from "buffer";

// Program ID - read from environment variable
const PROGRAM_ID = new PublicKey(
  typeof import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID === "string" &&
    import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    ? import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    : "AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu"
);

// PDA seed - must match the Anchor program
const PDA_SEED = "streak_2025";

// Instruction discriminators - using snake_case function names to match Anchor program
// SHA256("global:initialize_user_streak") = first 8 bytes
// SHA256("global:record_daily_engagement") = first 8 bytes
export const DISC_INITIALIZE = Buffer.from([137, 133, 92, 95, 173, 198, 211, 44]); // initialize_user_streak
export const DISC_RECORD = Buffer.from([104, 57, 123, 39, 254, 22, 31, 91]); // record_daily_engagement

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
  { days: 30, name: "Civic Champion", icon: "🏆", color: "#10b981" },
];

// Get PDA for user streak account
export const getUserStreakPDA = (userPubkey: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEED), userPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};

// Build instruction for program
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
    programId: PROGRAM_ID,
    data: discriminator,
  });
};

// Initialize streak account
export const initializeUserStreak = async (
  connection: Connection,
  wallet: any,
  userPubkey: PublicKey,
): Promise<string> => {
  // Get wallet adapter from wallet-adapter context
  const walletAdapter = wallet?.adapter || wallet;

  if (!walletAdapter?.signTransaction) {
    throw new Error("Wallet does not support signing transactions");
  }

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  // Create transaction with required fields
  const transaction = new Transaction({
    feePayer: userPubkey,
    recentBlockhash: blockhash,
  }).add(buildInstruction(userPubkey, DISC_INITIALIZE));

  // Sign and send
  const signedTx = await walletAdapter.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());

  return signature;
};

// Record daily engagement
export const recordDailyEngagement = async (
  connection: Connection,
  wallet: any,
  userPubkey: PublicKey,
): Promise<string> => {
  // Get wallet adapter from wallet-adapter context
  const walletAdapter = wallet?.adapter || wallet;

  if (!walletAdapter?.signTransaction) {
    throw new Error("Wallet does not support signing transactions");
  }

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  // Create transaction with required fields
  const transaction = new Transaction({
    feePayer: userPubkey,
    recentBlockhash: blockhash,
  }).add(buildInstruction(userPubkey, DISC_RECORD));

  // Sign and send
  const signedTx = await walletAdapter.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());

  return signature;
};

// Fetch user streak data from blockchain
export const fetchUserStreakData = async (
  connection: Connection,
  userPubkey: PublicKey,
): Promise<UserStreakData | null> => {
  const streakPDA = getUserStreakPDA(userPubkey);

  try {
    const accountInfo = await connection.getAccountInfo(streakPDA);

    if (!accountInfo) {
      return null;
    }

    // Manually decode account data (65 bytes total: 8 discriminator + 32 user + 8 streak + 8 last + 8 created + 1 milestone)
    const data = accountInfo.data;
    const streakCount = Number(data.readBigUInt64LE(40));  // Offset 40: after discriminator(8) + user(32)
    const lastInteractionTs = Number(data.readBigInt64LE(48)); // Offset 48: after discriminator + user + streak
    const createdTs = Number(data.readBigInt64LE(56)); // Offset 56: after discriminator + user + streak + last
    const milestoneClaimed = Number(data.readUInt8(64)); // Offset 64: after discriminator + user + streak + last + created

    return {
      user: userPubkey.toString(),
      streakCount,
      lastInteractionTs,
      createdTs,
      milestoneClaimed,
    };
  } catch (error) {
    console.error("Error fetching streak data:", error);
    return null;
  }
};

// Check if user has a streak account
export const hasStreakAccount = async (
  connection: Connection,
  userPubkey: PublicKey,
): Promise<boolean> => {
  const streakPDA = getUserStreakPDA(userPubkey);
  const accountInfo = await connection.getAccountInfo(streakPDA);
  return accountInfo !== null;
};
