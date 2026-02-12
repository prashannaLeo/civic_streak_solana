// Solana client helper for Civic Streak program - using web3.js directly
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// Program ID - only from .env (VITE_CIVIC_STREAK_PROGRAM_ID)
const PROGRAM_ID = import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID;

if (!PROGRAM_ID) {
  throw new Error("Missing VITE_CIVIC_STREAK_PROGRAM_ID in frontend/.env");
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
  { days: 30, name: "Civic Champion", icon: "🏆", color: "#10b981" },
];

// Get PDA for user streak account
export const getUserStreakPDA = (userPubkey: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("streak_v3"), userPubkey.toBuffer()],
    new PublicKey(PROGRAM_ID),
  );
  return pda;
};

// Initialize streak account
export const initializeUserStreak = async (
  connection: Connection,
  wallet: any,
  userPubkey: PublicKey,
): Promise<string> => {
  const streakPDA = getUserStreakPDA(userPubkey);
  const programId = new PublicKey(PROGRAM_ID);

  // Create instruction data: 0 for initialize_user_streak
  const instructionData = Buffer.from([0]);

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: streakPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data: instructionData,
  });

  const transaction = new Transaction().add(instruction);

  if (wallet.signTransaction) {
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
    );
    return signature;
  } else {
    throw new Error("Wallet does not support signing transactions");
  }
};

// Record daily engagement
export const recordDailyEngagement = async (
  connection: Connection,
  wallet: any,
  userPubkey: PublicKey,
): Promise<string> => {
  const streakPDA = getUserStreakPDA(userPubkey);
  const programId = new PublicKey(PROGRAM_ID);

  // Create instruction data: 1 for record_daily_engagement
  const instructionData = Buffer.from([1]);

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: streakPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data: instructionData,
  });

  const transaction = new Transaction().add(instruction);

  if (wallet.signTransaction) {
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
    );
    return signature;
  } else {
    throw new Error("Wallet does not support signing transactions");
  }
};

// Fetch user streak data
export const fetchUserStreakData = async (
  connection: Connection,
  userPubkey: PublicKey,
): Promise<UserStreakData | null> => {
  const streakPDA = getUserStreakPDA(userPubkey);

  try {
    const accountInfo = await connection.getParsedAccountInfo(streakPDA);

    if (!accountInfo.value) {
      return null;
    }

    const data = accountInfo.value.data as any;
    return {
      user: data.user.toString(),
      streakCount: Number(data.streakCount),
      lastInteractionTs: Number(data.lastInteractionTs),
      createdTs: Number(data.createdTs),
      milestoneClaimed: Number(data.milestoneClaimed),
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

  try {
    const accountInfo = await connection.getParsedAccountInfo(streakPDA);
    return accountInfo.value !== null;
  } catch (error) {
    return false;
  }
};

// Get current milestone
export const getCurrentMilestone = (streakCount: number): Milestone | null => {
  for (const milestone of [...MILESTONES].reverse()) {
    if (streakCount >= milestone.days) {
      return milestone;
    }
  }
  return null;
};

// Get next milestone
export const getNextMilestone = (streakCount: number): Milestone | null => {
  for (const milestone of MILESTONES) {
    if (streakCount < milestone.days) {
      return milestone;
    }
  }
  return null;
};

// Calculate days until next milestone
export const daysUntilNextMilestone = (streakCount: number): number => {
  const next = getNextMilestone(streakCount);
  return next ? next.days - streakCount : 0;
};

// Get milestone progress percentage
export const getMilestoneProgress = (
  streakCount: number,
  milestone: Milestone,
): number => {
  const prevDays = MILESTONES[MILESTONES.indexOf(milestone) - 1]?.days || 0;
  const progress =
    ((streakCount - prevDays) / (milestone.days - prevDays)) * 100;
  return Math.min(100, Math.max(0, progress));
};

// Alias for fetchUserStreakData
export const getUserStreak = fetchUserStreakData;
