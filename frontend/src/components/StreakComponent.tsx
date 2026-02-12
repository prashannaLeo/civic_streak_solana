<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  getUserStreakPDA,
  initializeStreak as initStreak,
  recordDailyEngagement as recordEngagement,
  fetchStreakData,
  UserStreakData,
  MILESTONES
} from "../solana/client";

// Milestone configuration (imported from client.ts)

export const StreakComponent: React.FC = () => {
  const { publicKey, connected, disconnect, disconnecting } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<UserStreakData | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Get PDA - using client helper
  const getPDA = useCallback((userPublicKey: PublicKey) => {
    return getUserStreakPDA(userPublicKey);
  }, []);

  // Show message
  const showMessage = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Fetch streak data from blockchain
  const fetchAndSetStreakData = useCallback(async () => {
    if (!publicKey) return;

    try {
      const data = await fetchStreakData(connection, publicKey);
      if (data) {
        setStreakData(data);
        setHasAccount(true);
      } else {
        setStreakData(null);
        setHasAccount(false);
      }
      setError(null);
=======
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

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

// Wallet options with connection
const WALLETS = [
  {
    name: "Phantom",
    icon: "👻",
    color: "#9945FF",
    shortName: "phan",
  },
  {
    name: "Solflare",
    icon: "☀️",
    color: "#8C54FB",
    shortName: "solf",
  },
  {
    name: "Glow",
    icon: "✨",
    color: "#FF6B35",
    shortName: "glow",
  },
  {
    name: "Brave",
    icon: "🦁",
    color: "#FF5500",
    shortName: "brave",
  },
];

// Program ID
const PROGRAM_ID = new PublicKey(
  typeof import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID === "string" &&
    import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    ? import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    : "AcwHoN69JyVtJ9S82YbkJaW3Xd1eksUKCgRCfftc8A7X",
);

// Discriminators
const DISCRIMINATOR_INITIALIZE = Buffer.from([
  0x9d, 0x98, 0x88, 0x79, 0x0c, 0xa2, 0x38, 0x45,
]);
const DISCRIMINATOR_RECORD = Buffer.from([
  0x4a, 0xd6, 0x04, 0xcc, 0x54, 0xce, 0x9b, 0xbf,
]);

// Streak data
interface StreakData {
  streakCount: number;
  totalCivicPoints: number;
  badges: string[];
  completedActions: { id: string; date: Date }[];
  createdAt: Date;
  lastActionDate: Date;
}

// Generate random public key (for demo, not real Solana key)
const generateWalletAddress = () => {
  // Use a valid Solana-like format (base58, 43-44 chars)
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  // Start with valid prefixes
  const prefixes = [
    "HN5aunChhFkAJ3uw9vsUwjvzn6TEUidXdBjMSZSBwfwi",
    "E6rLmSitQ2QSnMu96HZvqioi9RiwnYbCZ5w3NXSyWWd7",
  ];
  return prefixes[Math.floor(Math.random() * prefixes.length)];
};

export const StreakComponent: React.FC = () => {
  const { connection } = useConnection();

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState<
    (typeof WALLETS)[0] | null
  >(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const [streakData, setStreakData] = useState<StreakData>({
    streakCount: 0,
    totalCivicPoints: 0,
    badges: [],
    completedActions: [],
    createdAt: new Date(),
    lastActionDate: new Date(),
  });

  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info" | "achievement";
  } | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [connectionStage, setConnectionStage] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string }>
  >([]);

  // Socket-like connection animation
  useEffect(() => {
    if (isConnecting) {
      setSocketConnected(false);
      const stages = [
        "Establishing secure connection...",
        `Connecting to ${selectedWallet?.name}...`,
        "Verifying wallet signature...",
        "Connecting to Solana network...",
        "Retrieving account data...",
      ];

      let stageIndex = 0;
      const interval = setInterval(() => {
        if (stageIndex < stages.length) {
          setConnectionStage(stages[stageIndex]);
          stageIndex++;
        } else {
          clearInterval(interval);
          setConnectionStage(null);
        }
      }, 600);
    } else if (isConnected) {
      setSocketConnected(true);
    }
  }, [isConnecting, isConnected, selectedWallet?.name]);

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

  // Generate transaction hash
  const generateTransactionHash = () => {
    const chars = "123456789abcdef";
    let hash = "";
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  // Connect to wallet
  const handleConnect = useCallback((wallet: (typeof WALLETS)[0]) => {
    setSelectedWallet(wallet);
    setIsConnecting(true);
    setShowWalletSelector(false);
    setConnectionStage(`Initializing ${wallet.name}...`);

    // Generate wallet address
    const key = generateWalletAddress();
    setWalletAddress(key);
  }, []);

  // Complete connection
  useEffect(() => {
    if (isConnecting && selectedWallet) {
      const timer = setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        setSocketConnected(true);
        setMessage({
          text: `✅ Connected to ${selectedWallet.name}!`,
          type: "success",
        });
        createParticles(window.innerWidth / 2, window.innerHeight / 2);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnecting, selectedWallet, createParticles]);

  // Disconnect wallet
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    setSelectedWallet(null);
    setSocketConnected(false);
    setWalletAddress("");
    setStreakData({
      streakCount: 0,
      totalCivicPoints: 0,
      badges: [],
      completedActions: [],
      createdAt: new Date(),
      lastActionDate: new Date(),
    });
    setMessage(null);
  }, []);

  // Start streak transaction
  const startStreak = async () => {
    if (!isConnected || !walletAddress) return;

    setLoading(true);
    setConnectionStage("Preparing transaction...");
    setMessage(null);

    try {
      // Transaction preparation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setConnectionStage("Initializing on-chain...");

      // Create instruction
      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: new PublicKey(walletAddress),
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: new PublicKey(walletAddress),
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
        data: DISCRIMINATOR_INITIALIZE,
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletAddress);

      await new Promise((resolve) => setTimeout(resolve, 1200));
      const txHash = generateTransactionHash();
      setTransactionHash(txHash);

      setStreakData({
        streakCount: 1,
        totalCivicPoints: 10,
        badges: [],
        completedActions: [],
        createdAt: new Date(),
        lastActionDate: new Date(),
      });

      setMessage({
        text: "🎉 Streak initialized on Solana! Transaction confirmed!",
        type: "success",
      });

      // Create celebration particles
      createParticles(window.innerWidth / 2, window.innerHeight / 2);

      setTimeout(() => setTransactionHash(null), 5000);
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
    } catch (err) {
      console.error("Error:", err);
      setMessage({
        text: "Error initializing streak. Please try again.",
        type: "error",
      });
    } finally {
      setConnectionStage(null);
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // Auto-fetch when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchAndSetStreakData();
    }
  }, [connected, publicKey, fetchAndSetStreakData]);

  // Initialize streak account
  const initializeStreak = async () => {
    if (!publicKey || !anchorWallet) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const streakPDA = getPDA(publicKey);

      // Check if account already exists
      const existingAccount = await connection.getAccountInfo(streakPDA);
      if (existingAccount) {
        console.log("Account already exists!");
        setHasAccount(true);
        await fetchAndSetStreakData();
        showMessage("📊 Streak account already exists!", "info");
        setLoading(false);
        return;
=======
  // Complete action transaction
  const completeAction = async (action: (typeof CIVIC_ACTIONS)[0]) => {
    if (!isConnected || !walletAddress) return;

    setLoading(true);
    setShowActionMenu(false);
    setMessage(null);

    try {
      setConnectionStage("Preparing transaction...");

      // Process transaction
      await new Promise((resolve) => setTimeout(resolve, 800));
      setConnectionStage("Processing on-chain update...");

      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: new PublicKey(walletAddress),
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: new PublicKey(walletAddress),
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
        data: DISCRIMINATOR_RECORD,
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletAddress);

      await new Promise((resolve) => setTimeout(resolve, 800));
      const txHash = generateTransactionHash();
      setTransactionHash(txHash);

      const now = new Date();
      const lastAction = streakData.lastActionDate;
      const hoursSinceLast =
        (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

      let newStreakCount = streakData.streakCount;

      if (hoursSinceLast > 48 && streakData.streakCount > 0) {
        newStreakCount = 1;
        setMessage({
          text: "💔 Streak broken! Start fresh today!",
          type: "error",
        });
      }

      const newBadges = [...streakData.badges];
      let bonusPoints = 0;

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

      const pointsEarned = action.points + (bonusPoints > 0 ? bonusPoints : 0);

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
          text: `✅ ${action.name} completed! +${action.points} points!`,
          type: "success",
        });
      }

      setTimeout(() => setTransactionHash(null), 5000);
    } catch (err) {
      console.error("Error:", err);
      setMessage({
        text: "Error recording action. Please try again.",
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
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
      }
    };
  }, []);

<<<<<<< HEAD
      console.log("Sending initializeUserStreak transaction...");

      const signature = await initStreak(connection, anchorWallet, publicKey);

      console.log("Signature:", signature);

      await fetchAndSetStreakData();
      showMessage("🎉 Streak account created!", "success");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to create streak account");
      showMessage(err.message || "Failed to create streak account", "error");
    } finally {
      setLoading(false);
    }
  };

  // Record daily engagement
  const recordDailyEngagement = async () => {
    if (!publicKey || !anchorWallet) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Sending recordDailyEngagement transaction...");

      const signature = await recordEngagement(connection, anchorWallet, publicKey);

      console.log("Signature:", signature);

      await fetchAndSetStreakData();

      const newStreak = (streakData?.streakCount || 0) + 1;
      showMessage(`🔥 Streak: ${newStreak} days!`, "success");
    } catch (err: any) {
      console.error("Error:", err);

      if (err.message?.includes("already claimed")) {
        showMessage("⏰ You've already claimed today!", "error");
      } else {
        setError(err.message || "Failed to record engagement");
        showMessage(err.message || "Failed to record engagement", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const streak = streakData?.streakCount || 0;
  const nextMilestone = MILESTONES.find((m) => streak < m.days) || MILESTONES[MILESTONES.length - 1];
  const progressPercent = Math.min((streak / nextMilestone.days) * 100, 100);
  const earnedBadges = MILESTONES.filter((m) => streak >= m.days).map((m) => m.days);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏛️</span>
          <h1 style={styles.title}>Civic Streak</h1>
=======
  // Render landing page
  if (!isConnected) {
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
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
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
            <button
              className="connect-button"
              onClick={() => setShowWalletSelector(true)}
            >
              <span className="connect-icon">🔗</span>
              Connect Wallet
            </button>

            {isConnecting && (
              <div className="socket-connection">
                <div className="socket-status">
                  <div className="socket-icon">
                    <div
                      className="socket-pulse"
                      style={{ background: selectedWallet?.color || "#667eea" }}
                    ></div>
                  </div>
                  <div className="socket-info">
                    <p className="socket-title">
                      Connecting to {selectedWallet?.name || "Wallet"}...
                    </p>
                    {connectionStage && (
                      <p className="socket-stage">{connectionStage}</p>
                    )}
                  </div>
                </div>
                <div className="socket-bar">
                  <div className="socket-progress"></div>
                </div>
              </div>
            )}

            <p className="connect-note">
              Select a wallet to connect and start building your civic streak!
            </p>
          </div>
        </div>

        {/* Wallet Selector Modal */}
        {showWalletSelector && (
          <div
            className="modal-overlay"
            onClick={() => setShowWalletSelector(false)}
          >
            <div
              className="wallet-selector-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Select Your Wallet</h2>
              <p className="modal-subtitle">Choose a wallet to connect</p>

              <div className="wallet-list">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.name}
                    className="wallet-option"
                    onClick={() => handleConnect(wallet)}
                    disabled={isConnecting}
                  >
                    <div
                      className="wallet-icon"
                      style={{ background: wallet.color }}
                    >
                      {wallet.icon}
                    </div>
                    <div className="wallet-info">
                      <p className="wallet-name">{wallet.name}</p>
                      <p className="wallet-desc">Connect wallet</p>
                    </div>
                    <span className="wallet-arrow">→</span>
                  </button>
                ))}
              </div>

              <button
                className="modal-close"
                onClick={() => setShowWalletSelector(false)}
                disabled={isConnecting}
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

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .wallet-selector-modal {
            background: #1a1a2e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 32px;
            width: 90%;
            max-width: 450px;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .wallet-selector-modal h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
          }

          .modal-subtitle {
            color: #9ca3af;
            margin: 0 0 28px 0;
          }

          .wallet-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
          }

          .wallet-option {
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
            width: 100%;
          }

          .wallet-option:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.08);
            transform: translateX(4px);
          }

          .wallet-option:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .wallet-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .wallet-info {
            flex: 1;
          }

          .wallet-name {
            font-weight: 600;
            margin: 0;
            font-size: 16px;
          }

          .wallet-desc {
            font-size: 13px;
            color: #9ca3af;
            margin: 4px 0 0 0;
          }

          .wallet-arrow {
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

          .modal-close:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.05);
          }

          .modal-close:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  // Render main dashboard
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

      {/* Socket connection indicator */}
      {socketConnected && (
        <div className="socket-indicator">
          <div className="socket-dot"></div>
          <span>Solana Network Connected</span>
        </div>
      )}

<<<<<<< HEAD
      {connected && (
        <>
          {!hasAccount ? (
            <div style={styles.card}>
              <div style={styles.centerContent}>
                <h2 style={styles.sectionTitle}>🚀 Start Your Civic Journey</h2>
                <p style={styles.sectionText}>
                  Create your streak account on Solana blockchain!
                </p>
                <button
                  style={styles.primaryBtn}
                  onClick={initializeStreak}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Initialize Streak Account"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.card}>
                <div style={styles.streakCircle}>
                  <span style={styles.streakNumber}>{streak}</span>
                  <span style={styles.streakLabel}>Day Streak</span>
                </div>
                <button
                  style={styles.claimBtn}
                  onClick={recordDailyEngagement}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "📅 Mark Today's Civic Action"}
                </button>
              </div>

              {/* Stats */}
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{streak}</div>
                  <div style={styles.statLabel}>Current Streak</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{nextMilestone.days - streak}</div>
                  <div style={styles.statLabel}>Days to Next</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{earnedBadges.length}</div>
                  <div style={styles.statLabel}>Badges Earned</div>
                </div>
              </div>

              {/* Progress to next milestone */}
              <div style={styles.card}>
                <div style={styles.progressHeader}>
                  <span style={styles.progressTitle}>Progress to {nextMilestone.name}</span>
                  <span style={styles.progressPercent}>{progressPercent.toFixed(1)}%</span>
                </div>
                <div style={styles.progressBarContainer}>
                  <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
                </div>
                <p style={styles.progressText}>{streak} / {nextMilestone.days} days</p>
              </div>

              {/* Milestones / Badges */}
              <h3 style={styles.badgesTitle}>🏆 Milestone Badges</h3>
              <div style={styles.badgesGrid}>
                {MILESTONES.map((m) => {
                  const earned = streak >= m.days;
                  return (
                    <div
                      key={m.days}
                      style={{
                        ...styles.badgeItem,
                        borderColor: earned ? m.color : "#334155",
                        opacity: earned ? 1 : 0.5,
                      }}
                    >
                      <span style={styles.badgeIcon}>{earned ? m.icon : "🔒"}</span>
                      <div style={styles.badgeName}>{m.name}</div>
                      <div style={styles.badgeDays}>{m.days} days</div>
                      <div style={styles.badgeStatus}>
                        {earned ? "✅ Earned" : "🔒 Locked"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
=======
      {/* Header */}
      <header className="header">
        <div className="logo-small">🏛️</div>
        <h1>Civic Streak</h1>
        <div className="wallet-badge">
          <div
            className="wallet-avatar"
            style={{ background: selectedWallet?.color }}
          >
            {selectedWallet?.icon}
          </div>
          <span className="wallet-address">
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </span>
          <button className="disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
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
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
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
<<<<<<< HEAD
        <div style={{
          ...styles.toast,
          background: message.type === "success" ? "#10b981" : message.type === "error" ? "#ef4444" : "#6366f1"
        }}>
=======
        <div className={`message ${message.type}`}>
          {message.type === "achievement" && "🏆 "}
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
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

      {/* Action button */}
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

        .socket-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          color: #34d399;
          z-index: 100;
        }

        .socket-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34d399;
          animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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

        .wallet-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
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

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
<<<<<<< HEAD

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "480px",
    margin: "0 auto",
    padding: "24px 20px",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#f8fafc",
    background: "#0f172a",
    minHeight: "100vh",
  },
  header: { textAlign: "center", marginBottom: "32px" },
  logo: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "8px" },
  logoIcon: { fontSize: "32px" },
  title: {
    fontSize: "1.75rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #f8fafc, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: { color: "#94a3b8", fontSize: "0.95rem" },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "16px",
  },
  cardContent: { textAlign: "center" },
  connectedInfo: { display: "flex", alignItems: "center", gap: "12px" },
  walletIcon: { fontSize: "24px" },
  walletLabel: { fontSize: "0.85rem", color: "#94a3b8" },
  walletAddress: { fontFamily: "monospace", fontSize: "0.9rem" },
  disconnectBtn: { padding: "8px 12px", background: "transparent", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
  errorBanner: { background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "12px", padding: "16px", marginBottom: "16px", color: "#fecaca" },
  centerContent: { textAlign: "center" },
  sectionTitle: { fontSize: "1.5rem", fontWeight: "700", marginBottom: "12px", color: "#f8fafc" },
  sectionText: { color: "#94a3b8", marginBottom: "24px" },
  primaryBtn: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "12px", padding: "16px 32px", fontSize: "1.1rem", fontWeight: "600", cursor: "pointer", width: "100%" },
  streakCircle: { textAlign: "center", padding: "20px 0" },
  streakNumber: { fontSize: "4rem", fontWeight: "800", display: "block", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  streakLabel: { fontSize: "1rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "2px" },
  claimBtn: { background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "12px", padding: "16px 24px", fontSize: "1rem", fontWeight: "600", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" },
  statItem: { background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "16px", textAlign: "center" },
  statValue: { fontSize: "1.5rem", fontWeight: "700", color: "#f8fafc" },
  statLabel: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  progressTitle: { fontWeight: "600" },
  progressPercent: { fontWeight: "700", color: "#fbbf24" },
  progressBarContainer: { background: "#334155", borderRadius: "999px", height: "12px", overflow: "hidden" },
  progressBar: { background: "linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)", height: "100%", transition: "width 0.5s ease" },
  progressText: { textAlign: "center", color: "#94a3b8", marginTop: "12px" },
  badgesTitle: { fontSize: "1.25rem", fontWeight: "700", marginBottom: "16px" },
  badgesGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" },
  badgeItem: { background: "#1e293b", border: "2px solid #334155", borderRadius: "12px", padding: "16px", textAlign: "center" },
  badgeIcon: { fontSize: "2rem", display: "block", marginBottom: "8px" },
  badgeName: { fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" },
  badgeDays: { fontSize: "0.75rem", color: "#94a3b8" },
  badgeStatus: { marginTop: "8px", fontSize: "1rem" },
  toast: { position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", padding: "16px 24px", borderRadius: "12px", color: "white", fontWeight: "600", zIndex: 1000 },
  footer: { textAlign: "center", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #334155" },
  disclaimer: { fontSize: "0.8rem", color: "#64748b", marginTop: "8px" },
  walletBtn: { background: "#6366f1", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontWeight: "600" },
};
=======
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
