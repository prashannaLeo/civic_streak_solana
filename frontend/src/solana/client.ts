// Solana client helper for Civic Streak program - using web3.js directly
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";

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
  { days: 30, name: "Civic Champion", icon: "🏆", color: "#10b981" },
];

// Get PDA for user streak account
export const getUserStreakPDA = (userPubkey: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("streak_v3"), userPubkey.toBuffer()],
    programPublicKey,
  );
  return pda;
};

// Initialize streak account
export const initializeUserStreak = async (
  connection: Connection,
  wallet: any,
  userPubkey: PublicKey,
  discriminator: Buffer,
): TransactionInstruction => {
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

// Record daily engagement (raw transaction)
export const recordDailyEngagement = async (
  connection: Connection,
  wallet: anchor.Wallet | any,
  userPubkey: PublicKey,
): Promise<string> => {
  const provider = new anchor.AnchorProvider(connection as any, wallet, {
    commitment: "confirmed",
  });

  const tx = new Transaction().add(buildInstruction(userPubkey, DISC_RECORD));

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
  signature: string,
): Promise<void> => {
  await connection.confirmTransaction(signature, "confirmed");
};
