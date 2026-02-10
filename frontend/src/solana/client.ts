import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import IDL from "../../../target/idl/civic_streak.json";

// Program ID from environment variables (required for production)
const PROGRAM_ID = (() => {
  const programId = import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID;
  if (!programId) {
    throw new Error("VITE_CIVIC_STREAK_PROGRAM_ID environment variable is not set");
  }
  return new PublicKey(programId);
})();

// RPC endpoint configuration
export const getConnection = () => {
  const network = (import.meta.env.VITE_SOLANA_NETWORK || "devnet") as any;
  const rpcEndpoint = import.meta.env.VITE_SOLANA_RPC_ENDPOINT || clusterApiUrl(network);
  return new Connection(rpcEndpoint, "confirmed");
};

// Initialize Anchor provider
export const getProvider = (connection: Connection, wallet: any) => {
  return new AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  );
};

// Get the program instance
export const getProgram = (provider: AnchorProvider) => {
  // Avoid mixed PublicKey-class issues by passing programId as a base58 string.
  // @ts-ignore - Program constructor accepts (idl, programId, provider)
  return new Program(IDL as any, PROGRAM_ID.toString(), provider as any);
};

// Helper function to find user streak PDA
export const getUserStreakPDA = (userPublicKey: PublicKey) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("streak"), userPublicKey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};

// Calculate instruction discriminator
export const getInstructionDiscriminator = async (instructionName: string): Promise<Uint8Array> => {
  const message = "global:" + instructionName;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const discriminator = new Uint8Array(hashBuffer.slice(0, 8));
  console.log(`Discriminator for ${instructionName}: ${Buffer.from(discriminator).toString('hex')}`);
  return discriminator;
};

// Verify program ID matches
export const verifyProgramSetup = async (connection: Connection) => {
  try {
    const programAccount = await connection.getAccountInfo(PROGRAM_ID);
    if (!programAccount) {
      console.error(`Program not found at: ${PROGRAM_ID.toString()}`);
      return { success: false, error: "Program not deployed" };
    }
    console.log(`Program found at: ${PROGRAM_ID.toString()}`);
    console.log(`Program owner: ${programAccount.owner.toString()}`);
    return { success: true, programAccount };
  } catch (error) {
    console.error("Error verifying program:", error);
    return { success: false, error };
  }
};

// Initialize user streak
export const initializeUserStreak = async (
  program: Program,
  user: PublicKey
) => {
  const streakAccount = getUserStreakPDA(user);
  
  const tx = await program.methods
    .initializeUserStreak()
    .accounts({
      user,
      userStreak: streakAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  return tx;
};

// Record daily engagement
export const recordDailyEngagement = async (
  program: Program,
  user: PublicKey
) => {
  const streakAccount = getUserStreakPDA(user);
  
  const tx = await program.methods
    .recordDailyEngagement()
    .accounts({
      user,
      userStreak: streakAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  return tx;
};

// Get user streak data
export const getUserStreak = async (
  program: Program,
  user: PublicKey
) => {
  const streakAccount = getUserStreakPDA(user);
  
  try {
    // @ts-ignore - account.userStreak exists at runtime
    const account = await program.account.userStreak.fetch(streakAccount);
    return {
      user: account.user.toString(),
      streakCount: account.streakCount.toString(),
      lastInteractionTs: account.lastInteractionTs.toString(),
      createdTs: account.createdTs.toString(),
      milestoneClaimed: account.milestoneClaimed.toString(),
    };
  } catch (error) {
    console.log("No streak account found for user", error);
    return null;
  }
};

// Export PROGRAM_ID for use in other files
export { PROGRAM_ID };
