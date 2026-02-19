import React, { useState, useEffect, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { Buffer } from "buffer";
import {
  fetchUserStreakData,
  initializeUserStreak,
  recordDailyEngagement,
  getUserStreakPDA,
  UserStreakData,
  DISC_INITIALIZE,
  DISC_RECORD,
} from "../solana/client";

// Milestone configuration with gamification
const MILESTONES = [
  {
    days: 7,
    name: "Civic Starter",
    icon: "🌟",
    color: "#fbbf24",
    reward: "100 CIVIC Points",
  },
  {
    days: 14,
    name: "Active Citizen",
    icon: "⭐",
    color: "#60a5fa",
    reward: "150 CIVIC Points",
  },
  {
    days: 30,
    name: "Civic Champion",
    icon: "🏆",
    color: "#a78bfa",
    reward: "250 CIVIC Points",
  },
  {
    days: 50,
    name: "Democracy Hero",
    icon: "🎖️",
    color: "#f472b6",
    reward: "500 CIVIC Points",
  },
  {
    days: 100,
    name: "Civic Legend",
    icon: "👑",
    color: "#fb923c",
    reward: "1000 CIVIC Points",
  },
];

// Actions that users can complete
const CIVIC_ACTIONS = [
  { id: "vote", name: "Vote on Poll", icon: "🗳️", points: 10 },
  { id: "read", name: "Read Issue Summary", icon: "📰", points: 5 },
  { id: "share", name: "Share Civic Content", icon: "📤", points: 8 },
  { id: "discuss", name: "Join Discussion", icon: "💬", points: 12 },
];

// Program ID - should match the deployed program
const PROGRAM_ID = new PublicKey(
  typeof import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID === "string" &&
    import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    ? import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    : "9eVimSSosBbnjQmTjx7aGrKUo9ZJVmVEV7d6Li37Z526",
);

// Static priority fee - 1000 micro-lamports (0.001 SOL)
// This is sufficient for devnet transactions
const PRIORITY_FEE_MICRO_LAMPORTS = 1000;

const fetchPriorityFee = async (): Promise<number> => {
  console.log("[PriorityFee] Using static fee:", PRIORITY_FEE_MICRO_LAMPORTS);
  return PRIORITY_FEE_MICRO_LAMPORTS;
};

// Helper function to simulate transaction and get detailed error
const simulateTransaction = async (
  connection: Connection,
  transaction: Transaction,
  signer: PublicKey
): Promise<{ success: boolean; error?: string; logs?: string[] }> => {
  try {
    transaction.feePayer = signer;
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;

    const simulationResult = await connection.simulateTransaction(transaction);

    console.log("[Simulation] Result:", simulationResult.value);

    if (simulationResult.value.err) {
      const err = simulationResult.value.err as any;
      const logs = simulationResult.value.logs || [];
      
      // Try to extract meaningful error message
      let errorMsg = "Transaction simulation failed";
      if (typeof err === "string") {
        errorMsg = err;
      } else if (err?.InstructionError) {
        const instrErr = err.InstructionError as any;
        if (instrErr[1]?.Custom) {
          errorMsg = `Custom Error Code: ${instrErr[1].Custom}`;
        } else if (instrErr[1]?.ProgramError) {
          errorMsg = `Program Error: ${JSON.stringify(instrErr[1])}`;
        }
      }
      
      console.error("[Simulation] Error:", errorMsg, "Logs:", logs);
      return { success: false, error: errorMsg, logs };
    }

    return { success: true, logs: simulationResult.value.logs || undefined };
  } catch (error: any) {
    console.error("[Simulation] Exception:", error);
    return { success: false, error: error.message || "Simulation failed" };
  }
};

// Verify PDA derivation matches on-chain seeds
const verifyPDA = (userPubkey: PublicKey): { pda: PublicKey; bump: number; seeds: Buffer } => {
  const seeds = Buffer.from("streak_2025");
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [seeds, userPubkey.toBuffer()],
    PROGRAM_ID
  );
  console.log("[PDA] Derived:", pda.toBase58(), "Bump:", bump, "Seeds:", seeds.toString());
  return { pda, bump, seeds };
};

// Streak data
interface StreakData {
  streakCount: number;
  totalCivicPoints: number;
  badges: string[];
  completedActions: { id: string; date: Date }[];
  createdAt: Date;
  lastActionDate: Date;
}

// Fetch streak data from blockchain
const fetchStreakDataFromChain = async (
  connection: Connection,
  userPubkey: PublicKey,
): Promise<{
  streakCount: number;
  lastInteractionTs: number;
  createdTs: number;
} | null> => {
  try {
    const data = await fetchUserStreakData(connection, userPubkey);
    if (data) {
      return {
        streakCount: data.streakCount,
        lastInteractionTs: data.lastInteractionTs,
        createdTs: data.createdTs,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching streak data:", err);
    return null;
  }
};

export const StreakComponent: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, wallet, connected, connecting, disconnect, sendTransaction } = useWallet();

  // Wallet state - derive from actual wallet
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletName, setWalletName] = useState<string>("");

  const [streakData, setStreakData] = useState<StreakData>({
    streakCount: 0,
    totalCivicPoints: 0,
    badges: [],
    completedActions: [],
    createdAt: new Date(),
    lastActionDate: new Date(),
  });

  // State
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info" | "achievement";
  } | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [connectionStage, setConnectionStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string }>
  >([]);

  // Sync wallet state
  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toString());
      setWalletName(wallet?.adapter?.name || "Wallet");
      setMessage({
        text: `✅ Connected to ${wallet?.adapter?.name || "Wallet"}!`,
        type: "success",
      });
      createParticles(window.innerWidth / 2, window.innerHeight / 2);
    } else if (!connected && walletAddress) {
      // Wallet disconnected
      setWalletAddress("");
      setWalletName("");
    }
  }, [connected, publicKey, wallet]);

  // Particle animation for achievements
  const createParticles = useCallback((x: number, y: number) => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      size: Math.random() * 10 + 5,
      color: ["#fbbf24", "#f59e0b", "#667eea", "#764ba2", "#34d399", "#ff6b6b"][
        Math.floor(Math.random() * 6)
      ],
    }));
    setParticles(newParticles);

    animationRef.current = requestAnimationFrame(function animate() {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y - 4,
            size: p.size * 0.94,
            x: p.x + (Math.random() - 0.5) * 2,
          }))
          .filter((p) => p.size > 0.5),
      );
      if (animationRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    });
  }, []);

  // Disconnect wallet
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setStreakData({
        streakCount: 0,
        totalCivicPoints: 0,
        badges: [],
        completedActions: [],
        createdAt: new Date(),
        lastActionDate: new Date(),
      });
      setMessage(null);
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }, [disconnect]);

  // Start streak transaction - REAL Solana transaction
  const startStreak = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setConnectionStage("Preparing transaction...");
    setMessage(null);
    setError(null);
    setMessage(null);

    try {
      // Step 1: Verify PDA derivation
      console.log("[startStreak] Starting transaction for user:", publicKey.toBase58());
      const { pda: streakPDA } = verifyPDA(publicKey);
      console.log("[startStreak] PDA derived:", streakPDA.toBase58());

      // Step 1.5: Check if account already exists
      setConnectionStage("Checking existing account...");
      const existingData = await fetchUserStreakData(connection, publicKey);
      if (existingData) {
        // Account exists and can be read - user is already initialized
        console.log("[startStreak] Account already exists:", existingData);
        setStreakData({
          streakCount: existingData.streakCount,
          totalCivicPoints: existingData.streakCount * 10, // Approximate
          badges: [],
          completedActions: [],
          createdAt: new Date(existingData.createdTs * 1000),
          lastActionDate: new Date(existingData.lastInteractionTs * 1000),
        });
        setMessage({
          text: "You already have a streak! Use 'Record Civic Action' to continue.",
          type: "info",
        });
        return;
      }

      // Step 2: Fetch priority fee
      setConnectionStage("Fetching priority fee...");
      const priorityFee = await fetchPriorityFee();

      // Step 3: Create priority fee instruction
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      });

      // Step 4: Create main instruction
      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: streakPDA,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: PROGRAM_ID,
        data: DISC_INITIALIZE,
      });

      // Step 5: Build transaction with priority fee
      console.log("[startStreak] Building transaction...");
      const transaction = new Transaction()
        .add(computeBudgetIx)
        .add(instruction);

      console.log("[startStreak] Getting blockhash...");
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      console.log("[startStreak] Blockhash:", blockhash);
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("[startStreak] Transaction details:");
      console.log("  - Instructions:", transaction.instructions.length);
      console.log("  - FeePayer:", transaction.feePayer?.toBase58());
      console.log("  - RecentBlockhash:", transaction.recentBlockhash);

      // Log first instruction data for debugging
      if (transaction.instructions[0]) {
        console.log("[startStreak] Instruction 0 (compute):", {
          programId: transaction.instructions[0].programId?.toBase58(),
          keys: transaction.instructions[0].keys.map(k => k.pubkey.toBase58()),
          data: Array.from(transaction.instructions[0].data || [])
        });
      }
      if (transaction.instructions[1]) {
        console.log("[startStreak] Instruction 1 (main):", {
          programId: transaction.instructions[1].programId?.toBase58(),
          keys: transaction.instructions[1].keys.map(k => k.pubkey.toBase58()),
          data: Array.from(transaction.instructions[1].data || [])
        });
      }

      // Step 6: Skip simulation for init - it causes issues with new accounts
      // The transaction will fail on-chain if there's a real problem
      setConnectionStage("Sending transaction...");

      // Step 7: Send transaction
      setConnectionStage("Sending transaction...");

      let sig: string | null = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          setConnectionStage(
            `Sending transaction (attempt ${attempt}/${maxRetries})...`,
          );
          
          console.log("[startStreak] Attempt", attempt, "-", {
            walletAdapter: wallet?.adapter?.name,
            // @ts-ignore - signTransaction exists on actual wallet adapters
            hasSignTransaction: !!wallet?.adapter?.signTransaction,
            hasSendTransaction: !!wallet?.adapter?.sendTransaction,
            network: connection.rpcEndpoint
          });

          console.log("[startStreak] Calling wallet.signTransaction() first...");
          
          // Try signTransaction first, then send
          // @ts-ignore - signTransaction exists on actual wallet adapters
          const signedTx = await wallet?.adapter?.signTransaction(transaction);
          console.log("[startStreak] Signed transaction:", signedTx ? "yes" : "no");
          
          if (signedTx) {
            console.log("[startStreak] Now sending signed transaction...");
            
            // Skip preflight simulation - account might be in inconsistent state from previous attempts
            const txResult = await connection.sendRawTransaction(signedTx.serialize(), {
              skipPreflight: true,
              maxRetries: 10
            });
            console.log("[startStreak] Transaction result:", txResult);
            if (txResult) {
              sig = txResult;
              break;
            }
          } else {
            // Fallback to sendTransaction
            console.log("[startStreak] signTransaction returned null, trying sendTransaction...");
            const txResult = await wallet?.adapter?.sendTransaction(
              transaction,
              connection,
              {
                skipPreflight: false,
                maxRetries: 5,
              },
            );
            console.log("[startStreak] Transaction result:", txResult);
            if (txResult) {
              sig = txResult;
              break;
            }
          }
        } catch (err: any) {
          console.error(`Attempt ${attempt} failed:`, err);
          console.error("Error details:", {
            message: err.message,
            code: err.code,
            stack: err.stack,
            cause: err.cause
          });
          if (attempt === maxRetries) {
            throw new Error(
              `Transaction failed after ${maxRetries} attempts: ${err.message}`,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (sig) {
        setTransactionHash(sig);
        setConnectionStage("Confirming transaction...");

        // Wait for confirmation with longer timeout
        try {
          await connection.confirmTransaction(sig, "finalized");
        } catch (confirmErr) {
          // Try with confirmed commitment instead
          await connection.confirmTransaction(sig, "confirmed");
        }

        setStreakData({
          streakCount: 1,
          totalCivicPoints: 10,
          badges: [],
          completedActions: [],
          createdAt: new Date(),
          lastActionDate: new Date(),
        });

        setMessage({
          text: `🎉 Streak initialized on Solana! Tx: ${sig.slice(0, 8)}...`,
          type: "success",
        });

        createParticles(window.innerWidth / 2, window.innerHeight / 2);

        setTimeout(() => setTransactionHash(null), 5000);
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Error initializing streak. Please try again.");
      setMessage({
        text: err.message || "Error initializing streak. Please try again.",
        type: "error",
      });
    } finally {
      setConnectionStage(null);
      setLoading(false);
    }
  };

  // Complete action transaction - REAL Solana transaction
  const completeAction = async (action: (typeof CIVIC_ACTIONS)[0]) => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setShowActionMenu(false);
    setMessage(null);
    setError(null);
    setMessage(null);

    try {
      // Step 1: Verify PDA derivation matches on-chain
      console.log("[completeAction] Starting transaction for user:", publicKey.toBase58());
      const { pda: streakPDA, bump, seeds } = verifyPDA(publicKey);
      console.log("[completeAction] PDA derived:", streakPDA.toBase58());

      // Step 2: Fetch priority fee from Helius
      setConnectionStage("Fetching priority fee...");
      const priorityFee = await fetchPriorityFee();
      console.log("[completeAction] Priority fee:", priorityFee);

      // Step 3: Create priority fee instruction
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      });

      // Step 4: Create main instruction
      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: streakPDA,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: PROGRAM_ID,
        data: DISC_RECORD,
      });

      // Step 5: Build transaction with priority fee
      const transaction = new Transaction()
        .add(computeBudgetIx)
        .add(instruction);

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Step 6: Simulate transaction to get detailed error
      setConnectionStage("Simulating transaction...");
      const simResult = await simulateTransaction(connection, transaction, publicKey);
      
      if (!simResult.success) {
        console.error("[completeAction] Simulation failed:", simResult.error);
        console.error("[completeAction] Simulation logs:", simResult.logs);
        
        // Check for specific common errors
        let errorMessage = simResult.error || "Transaction simulation failed";
        
        if (simResult.logs) {
          // Check for "AlreadyClaimedToday" or similar
          if (simResult.logs.some((log: string) => log.includes("AlreadyClaimed"))) {
            errorMessage = "You've already claimed your civic action today! Come back tomorrow.";
          } else if (simResult.logs.some((log: string) => log.includes("AccountNotInitialized"))) {
            errorMessage = "Streak account not found. Please initialize your streak first.";
          } else if (simResult.logs.some((log: string) => log.includes("InvalidProgramArgument"))) {
            errorMessage = "PDA derivation mismatch. Please refresh and try again.";
          }
        }
        
        throw new Error(errorMessage);
      }
      
      console.log("[completeAction] Simulation successful, logs:", simResult.logs);

      // Step 7: Send REAL transaction using wallet with retry
      setConnectionStage("Sending transaction...");

      let sig: string | null = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          setConnectionStage(
            `Sending transaction (attempt ${attempt}/${maxRetries})...`,
          );
          const txResult = await wallet?.adapter?.sendTransaction(
            transaction,
            connection,
            {
              skipPreflight: false,
              maxRetries: 5,
            },
          );
          if (txResult) {
            sig = txResult;
            break;
          }
        } catch (err: any) {
          console.error(`Attempt ${attempt} failed:`, err);
          if (attempt === maxRetries) {
            throw new Error(
              `Transaction failed after ${maxRetries} attempts: ${err.message}`,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (sig) {
        setTransactionHash(sig);
        setConnectionStage("Confirming transaction...");

        // Wait for confirmation
        let confirmed = false;
        try {
          await connection.confirmTransaction(sig, "finalized");
          confirmed = true;
        } catch (confirmErr) {
          // Try with confirmed commitment instead
          try {
            await connection.confirmTransaction(sig, "confirmed");
            confirmed = true;
          } catch (err2) {
            console.warn(
              "Transaction confirmation timeout, but may have succeeded:",
              sig,
            );
          }
        }

        // Fetch the actual updated streak data from blockchain
        setConnectionStage("Fetching updated streak data...");

        // Retry fetching streak data up to 3 times with delay
        let updatedStreakData = null;
        for (let retry = 0; retry < 3; retry++) {
          updatedStreakData = await fetchStreakDataFromChain(
            connection,
            publicKey,
          );
          if (updatedStreakData) break;
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * (retry + 1)),
          );
        }

        if (updatedStreakData) {
          const now = new Date();

          // Calculate streak based on actual blockchain data
          const lastAction = new Date(
            updatedStreakData.lastInteractionTs * 1000,
          );
          const hoursSinceLast =
            (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

          let newStreakCount = updatedStreakData.streakCount;

          // Check if streak was reset (within 48h window should continue, else reset)
          if (hoursSinceLast > 48 && updatedStreakData.streakCount > 1) {
            // The blockchain already reset the streak, use the value as-is
            newStreakCount = updatedStreakData.streakCount;
          }

          const newBadges = [...streakData.badges];
          let bonusPoints = 0;

          // Check for new milestone badges
          MILESTONES.forEach((milestone) => {
            if (
              newStreakCount === milestone.days &&
              !newBadges.includes(milestone.name)
            ) {
              newBadges.push(milestone.name);
              bonusPoints += 50;
              setMessage({
                text: `🎊 ${milestone.name} Badge Earned! +50 bonus!`,
                type: "achievement",
              });
              createParticles(window.innerWidth / 2, window.innerHeight / 2);
            }
          });

          const pointsEarned =
            action.points + (bonusPoints > 0 ? bonusPoints : 0);

          setStreakData({
            ...streakData,
            streakCount: newStreakCount,
            totalCivicPoints: streakData.totalCivicPoints + pointsEarned,
            badges: newBadges,
            completedActions: [
              ...streakData.completedActions,
              { id: action.id, date: now },
            ],
            lastActionDate: now,
          });

          if (!bonusPoints) {
            setMessage({
              text: `✅ ${action.name} completed! +${action.points} points! Streak: ${newStreakCount}`,
              type: "success",
            });
          }
        } else {
          // Fallback if fetch fails - increment local streak
          const now = new Date();
          setStreakData({
            ...streakData,
            streakCount: streakData.streakCount + 1,
            totalCivicPoints: streakData.totalCivicPoints + action.points,
            completedActions: [
              ...streakData.completedActions,
              { id: action.id, date: now },
            ],
            lastActionDate: now,
          });
          setMessage({
            text: `✅ ${action.name} completed! +${action.points} points!`,
            type: "success",
          });
        }

        setTimeout(() => setTransactionHash(null), 5000);
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Error recording action. Please try again.");
      setMessage({
        text: err.message || "Error recording action. Please try again.",
        type: "error",
      });
    } finally {
      setConnectionStage(null);
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Render landing page when not connected
  if (!connected) {
    return (
      <div className="landing-container">
        <div className="particles">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                background: p.color,
              }}
            />
          ))}
        </div>

        <div className="landing-content">
          <div className="hero-section">
            <div className="logo-animated">🏛️</div>
            <h1>Civic Streak</h1>
            <p className="tagline">
              Build your civic engagement on Solana blockchain
            </p>

            <div className="features">
              <div className="feature">
                <span className="feature-icon">🔥</span>
                <span>Daily Streaks</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🏆</span>
                <span>NFT Badges</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🪙</span>
                <span>CIVIC Points</span>
              </div>
            </div>
          </div>

          <div className="connect-section">
            <WalletMultiButton />
            <p className="connect-note">
              Connect your Phantom, Solflare, or other Solana wallet to start
              building your civic streak!
            </p>
          </div>
        </div>

        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          .landing-container {
            min-height: 100vh;
            width: 100%;
            background: linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 50%, #1a1a2e 100%);
            color: #fff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }

          .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .particle {
            position: absolute;
            border-radius: 50%;
            animation: particleFloat 3s ease-out forwards;
          }

          @keyframes particleFloat {
            to {
              transform: translateY(-200px) scale(0);
              opacity: 0;
            }
          }

          .landing-content {
            max-width: 600px;
            width: 100%;
            padding: 40px;
            text-align: center;
            z-index: 1;
          }

          .hero-section {
            margin-bottom: 60px;
          }

          .logo-animated {
            font-size: 80px;
            margin-bottom: 24px;
            animation: float 3s ease-in-out infinite;
            display: inline-block;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }

          h1 {
            font-size: 56px;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #fbbf24 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
          }

          .tagline {
            font-size: 20px;
            color: #9ca3af;
            margin-bottom: 40px;
          }

          .features {
            display: flex;
            justify-content: center;
            gap: 32px;
          }

          .feature {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            color: #d1d5db;
          }

          .feature-icon {
            font-size: 24px;
          }

          .connect-section {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 32px;
          }

          .connect-button {
            width: 100%;
            padding: 18px 32px;
            font-size: 18px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 16px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 24px;
            transition: all 0.3s ease;
          }

          .connect-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
          }

          /* Wallet Multi Button Styles */
          .wallet-adapter-button {
            width: 100% !important;
            padding: 18px 32px !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            border-radius: 16px !important;
            color: white !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 12px !important;
            transition: all 0.3s ease !important;
            margin-bottom: 24px !important;
          }

          .wallet-adapter-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4) !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          }

          .wallet-adapter-button-start-icon {
            display: flex !important;
            align-items: center !important;
          }

          .connect-icon {
            font-size: 20px;
          }

          .socket-connection {
            margin-bottom: 24px;
          }

          .socket-status {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;
          }

          .socket-icon {
            width: 40px;
            height: 40px;
            position: relative;
          }

          .socket-pulse {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #667eea;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
          }

          .socket-title {
            font-weight: 600;
            margin: 0;
          }

          .socket-stage {
            font-size: 14px;
            color: #9ca3af;
            margin: 4px 0 0 0;
          }

          .socket-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
          }

          .socket-progress {
            height: 100%;
            width: 60%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
            animation: progress 2s ease-in-out infinite;
          }

          @keyframes progress {
            0% { width: 20%; }
            50% { width: 80%; }
            100% { width: 20%; }
          }

          .connect-note {
            font-size: 14px;
            color: #9ca3af;
          }
        `}</style>
      </div>
    );
  }

  // Render main dashboard when connected
  return (
    <div className="dashboard-container">
      {/* Particles */}
      <div className="particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
            }}
          />
        ))}
      </div>

      {/* Error message */}
      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Header */}
      <header className="header">
        <div className="logo-small">🏛️</div>
        <h1>Civic Streak</h1>
        <div className="wallet-badge">
          <span className="wallet-address">
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </span>
          <WalletDisconnectButton />
        </div>
      </header>

      {/* Transaction notification */}
      {transactionHash && (
        <div className="transaction-notification">
          <div className="tx-icon">⛓️</div>
          <div className="tx-info">
            <p className="tx-title">Transaction Confirmed!</p>
            <p className="tx-hash">
              {transactionHash.slice(0, 20)}...{transactionHash.slice(-12)}
            </p>
          </div>
        </div>
      )}

      {/* Connection stage */}
      {connectionStage && (
        <div className="connection-stage">
          <div className="stage-spinner"></div>
          <p>{connectionStage}</p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.type === "achievement" && "🏆 "}
          {message.text}
        </div>
      )}

      {/* Main streak card */}
      <div className="streak-card">
        <div className="streak-glow"></div>
        <div className="streak-main">
          <div className="streak-flame">🔥</div>
          <div className="streak-count">{streakData.streakCount}</div>
          <div className="streak-label">Day Streak</div>
        </div>

        <div className="points-display">
          <div className="points-icon">🪙</div>
          <div className="points-value">{streakData.totalCivicPoints}</div>
          <div className="points-label">CIVIC Points</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <p className="stat-value">{formatDate(streakData.createdAt)}</p>
            <p className="stat-label">Started</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <p className="stat-value">{streakData.completedActions.length}</p>
            <p className="stat-label">Actions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏅</div>
          <div className="stat-info">
            <p className="stat-value">{streakData.badges.length}</p>
            <p className="stat-label">Badges</p>
          </div>
        </div>
      </div>

      {/* Action buttons - Show different buttons based on streak state */}
      {streakData.streakCount === 0 ? (
        // New user - show Start Streak button
        <button
          className="action-button start-button"
          onClick={startStreak}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              Processing...
            </>
          ) : (
            <>🚀 Start My Streak</>
          )}
        </button>
      ) : (
        // Existing user - show Record Civic Action button
        <button
          className="action-button"
          onClick={() => setShowActionMenu(true)}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              Processing...
            </>
          ) : (
            <>📝 Record Civic Action</>
          )}
        </button>
      )}

      {/* Badges */}
      {streakData.badges.length > 0 && (
        <div className="badges-section">
          <h3>🏆 Your Badges</h3>
          <div className="badges-grid">
            {streakData.badges.map((badgeName) => {
              const milestone = MILESTONES.find((m) => m.name === badgeName);
              return (
                <div
                  key={badgeName}
                  className="badge earned"
                  style={{ borderColor: milestone?.color }}
                >
                  <div className="badge-icon">{milestone?.icon}</div>
                  <div className="badge-name">{badgeName}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="milestones-section">
        <h3>🎯 Milestones</h3>
        <div className="milestones-list">
          {MILESTONES.map((milestone) => (
            <div
              key={milestone.days}
              className={`milestone ${streakData.streakCount >= milestone.days ? "earned" : "locked"}`}
              style={{
                borderColor:
                  streakData.streakCount >= milestone.days
                    ? milestone.color
                    : "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="milestone-icon"
                style={{
                  background:
                    streakData.streakCount >= milestone.days
                      ? milestone.color
                      : "rgba(255,255,255,0.1)",
                }}
              >
                {milestone.icon}
              </div>
              <div className="milestone-info">
                <p className="milestone-name">{milestone.name}</p>
                <p className="milestone-days">{milestone.days} days</p>
              </div>
              {streakData.streakCount >= milestone.days && (
                <div className="milestone-check">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action modal */}
      {showActionMenu && (
        <div className="modal-overlay" onClick={() => setShowActionMenu(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Choose an Action</h3>
            <p className="modal-subtitle">
              Complete a civic action to earn points
            </p>

            <div className="action-list">
              {CIVIC_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  className="action-item"
                  onClick={() => completeAction(action)}
                  disabled={loading}
                >
                  <span className="action-icon">{action.icon}</span>
                  <div className="action-info">
                    <p className="action-name">{action.name}</p>
                    <p className="action-points">+{action.points} points</p>
                  </div>
                  <span className="action-arrow">→</span>
                </button>
              ))}
            </div>

            <button
              className="modal-close"
              onClick={() => setShowActionMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard-container {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 50%, #1a1a2e 100%);
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          animation: particleFloat 3s ease-out forwards;
        }

        @keyframes particleFloat {
          to {
            transform: translateY(-200px) scale(0);
            opacity: 0;
          }
        }

        .error-message {
          margin: 20px 40px;
          padding: 16px 20px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          color: #f87171;
          font-weight: 500;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo-small {
          font-size: 36px;
        }

        .header h1 {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .wallet-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
          background: rgba(255, 255, 255, 0.05);
          padding: 10px 16px;
          border-radius: 24px;
        }

        .wallet-address {
          font-family: monospace;
          font-size: 14px;
          color: #9ca3af;
        }

        .disconnect-btn {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #f87171;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .disconnect-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .wallet-adapter-disconnect-button {
          background: transparent !important;
          border: 1px solid rgba(239, 68, 68, 0.5) !important;
          color: #f87171 !important;
          padding: 6px 12px !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-size: 12px !important;
          transition: all 0.2s !important;
        }

        .wallet-adapter-disconnect-button:hover {
          background: rgba(239, 68, 68, 0.1) !important;
        }

        .transaction-notification {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
          border: 1px solid rgba(16, 185, 129, 0.3);
          margin: 20px 40px;
          padding: 16px 20px;
          border-radius: 16px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .tx-icon {
          font-size: 28px;
        }

        .tx-title {
          font-weight: 600;
          color: #34d399;
          margin: 0;
        }

        .tx-hash {
          font-family: monospace;
          font-size: 12px;
          color: #9ca3af;
          margin: 4px 0 0 0;
        }

        .connection-stage {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 40px;
          padding: 16px 20px;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
        }

        .stage-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .message {
          margin: 0 40px;
          padding: 16px 20px;
          border-radius: 16px;
          font-weight: 500;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .message.success {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .message.error {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .message.achievement {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2));
          color: #fbbf24;
        }

        .streak-card {
          margin: 40px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 32px;
          padding: 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .streak-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 50%);
          animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
          to { transform: rotate(360deg); }
        }

        .streak-main {
          position: relative;
          margin-bottom: 32px;
        }

        .streak-flame {
          font-size: 56px;
          animation: pulse 2s ease-in-out infinite;
          display: inline-block;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .streak-count {
          font-size: 96px;
          font-weight: 800;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }

        .streak-label {
          font-size: 22px;
          color: #9ca3af;
          margin-top: 8px;
        }

        .points-display {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(16, 185, 129, 0.15);
          padding: 16px 32px;
          border-radius: 20px;
          position: relative;
        }

        .points-icon {
          font-size: 36px;
        }

        .points-value {
          font-size: 36px;
          font-weight: 700;
          color: #34d399;
        }

        .points-label {
          font-size: 14px;
          color: #9ca3af;
          display: block;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 0 40px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
        }

        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          margin: 4px 0 0 0;
        }

        .action-button {
          margin: 40px 40px 60px;
          padding: 20px 40px;
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: calc(100% - 80px);
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
        }

        .action-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .badges-section {
          margin: 0 40px 60px;
        }

        .badges-section h3 {
          margin-bottom: 20px;
          font-size: 22px;
        }

        .badges-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 24px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid;
        }

        .badge-icon {
          font-size: 40px;
          margin-bottom: 8px;
        }

        .badge-name {
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .milestones-section {
          margin: 0 40px 60px;
        }

        .milestones-section h3 {
          margin-bottom: 20px;
          font-size: 22px;
        }

        .milestones-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .milestone {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          opacity: 0.5;
        }

        .milestone.earned {
          opacity: 1;
          background: rgba(255, 255, 255, 0.03);
        }

        .milestone-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .milestone-info {
          flex: 1;
        }

        .milestone-name {
          font-weight: 600;
          margin: 0;
        }

        .milestone-days {
          font-size: 13px;
          color: #9ca3af;
          margin: 4px 0 0 0;
        }

        .milestone-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #34d399;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #0a0a0f;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .modal {
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 32px;
          width: 90%;
          max-width: 450px;
          animation: slideUp 0.3s ease;
        }

        .modal h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }

        .modal-subtitle {
          color: #9ca3af;
          margin: 0 0 28px 0;
        }

        .action-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .action-item:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .action-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-icon {
          font-size: 32px;
        }

        .action-info {
          flex: 1;
        }

        .action-name {
          font-weight: 600;
          margin: 0;
        }

        .action-points {
          font-size: 13px;
          color: #34d399;
          margin: 4px 0 0 0;
        }

        .action-arrow {
          color: #9ca3af;
          font-size: 18px;
        }

        .modal-close {
          width: 100%;
          padding: 16px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #9ca3af;
          border-radius: 16px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};
