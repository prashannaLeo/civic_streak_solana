import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { sha256 } from "@noble/hashes/sha256";

// Milestone configuration
const MILESTONES = [
  { days: 7, name: "Civic Starter", icon: "🌟", color: "#fbbf24" },
  { days: 14, name: "Consistent", icon: "⭐", color: "#60a5fa" },
  { days: 30, name: "Champion", icon: "🏆", color: "#a78bfa" },
];

// Program ID from environment variable
const PROGRAM_ID = new PublicKey(
  typeof import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID === "string" && import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    ? import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    : "AcwHoN69JyVtJ9S82YbkJaW3Xd1eksUKCgRCfftc8A7X"
);

// Derive instruction discriminators (first 8 bytes of sha256("global:<snake_case_name>"))
const getIxDiscriminator = (name: string): Buffer => {
  const preimage = new TextEncoder().encode(`global:${name}`);
  const hash = sha256.create().update(preimage).digest(); // Uint8Array(32)
  return Buffer.from(hash.slice(0, 8));
};

const DISCRIMINATOR_INITIALIZE = getIxDiscriminator("initialize_user_streak");
const DISCRIMINATOR_RECORD = getIxDiscriminator("record_daily_engagement");

// Helper to get streak PDA
const getUserStreakPDA = (userPublicKey: PublicKey) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("streak"), userPublicKey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};

// Interface for streak data
interface UserStreakData {
  user: string;
  streakCount: number;
  lastInteractionTs: number;
  createdTs: number;
  milestoneClaimed: number;
}

export const StreakComponent: React.FC = () => {
  const { publicKey, connected, disconnect, disconnecting, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<UserStreakData | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Fetch streak data from blockchain
  const fetchStreakData = useCallback(async () => {
    if (!publicKey) return;

    try {
      const streakPDA = getUserStreakPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(streakPDA);
      
      if (accountInfo && accountInfo.data.length > 0) {
        const data = accountInfo.data;
        const user = new PublicKey(data.slice(0, 32)).toString();
        const streakCount = Number(data.slice(32, 40).readBigUInt64LE());
        const lastInteractionTs = Number(data.slice(40, 48).readBigInt64LE());
        const createdTs = Number(data.slice(48, 56).readBigInt64LE());
        const milestoneClaimed = data[56];
        
        setStreakData({
          user,
          streakCount,
          lastInteractionTs,
          createdTs,
          milestoneClaimed,
        });
        setHasAccount(true);
      } else {
        setStreakData(null);
        setHasAccount(false);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching streak:", err);
      setError("Failed to fetch streak data from blockchain");
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchStreakData();
    }
  }, [connected, publicKey, fetchStreakData]);

  // Build instruction for this program with correct accounts + discriminator
  const createInstruction = (
    userPubkey: PublicKey,
    discriminator: Buffer
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
  const initializeStreak = async () => {
    if (!publicKey || !sendTransaction) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("=== DEBUG ===");
      console.log("Program ID:", PROGRAM_ID.toString());
      console.log("User:", publicKey.toString());

      // Check if program exists
      const programAccount = await connection.getAccountInfo(PROGRAM_ID);
      if (!programAccount) {
        throw new Error("Program not deployed at " + PROGRAM_ID.toString());
      }

      const streakPDA = getUserStreakPDA(publicKey);

      // Check if account already exists
      const existingAccount = await connection.getAccountInfo(streakPDA);
      if (existingAccount) {
        console.log("Account already exists!");
        setHasAccount(true);
        await fetchStreakData();
        showMessage("📊 Streak account already exists!", "info");
        setLoading(false);
        return;
      }

      // Build and send raw transaction using correct discriminator
      const instruction = createInstruction(publicKey, DISCRIMINATOR_INITIALIZE);
      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Sending transaction...");
      const signature = await sendTransaction(transaction, connection);
      console.log("Signature:", signature);

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      await fetchStreakData();
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
    if (!publicKey || !sendTransaction) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const instruction = createInstruction(publicKey, DISCRIMINATOR_RECORD);
      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      
      await fetchStreakData();
      
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

  const showMessage = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
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
        </div>
        <p style={styles.subtitle}>Build consistent civic habits on Solana</p>
      </header>

      <div style={styles.card}>
        <div style={styles.cardContent}>
          {!connected ? (
            <WalletMultiButton style={styles.walletBtn} />
          ) : (
            <div style={styles.connectedInfo}>
              <div style={styles.walletIcon}>✅</div>
              <div style={{ flex: 1 }}>
                <div style={styles.walletLabel}>Connected</div>
                <div style={styles.walletAddress}>
                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </div>
              </div>
              <button
                style={styles.disconnectBtn}
                onClick={() => disconnect()}
                disabled={disconnecting}
              >
                {disconnecting ? "..." : "🔌"}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          ❌ {error}
        </div>
      )}

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
                  <span>📮</span>
                  {loading ? "Processing..." : "Mark Today's Civic Action"}
                </button>
              </div>

              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>
                    {streakData?.lastInteractionTs 
                      ? new Date(streakData.lastInteractionTs * 1000).toLocaleDateString()
                      : "--"}
                  </div>
                  <div style={styles.statLabel}>Last Active</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{earnedBadges.length}</div>
                  <div style={styles.statLabel}>Badges</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{streakData?.milestoneClaimed || 0}</div>
                  <div style={styles.statLabel}>Milestones</div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.progressHeader}>
                  <span style={styles.progressTitle}>🎯 Next Milestone</span>
                  <span style={styles.progressPercent}>{Math.round(progressPercent)}%</span>
                </div>
                <div style={styles.progressBarContainer}>
                  <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
                </div>
                <p style={styles.progressText}>
                  {streak >= 100
                    ? "🎉 All milestones achieved!"
                    : `${nextMilestone.days - streak} days until ${nextMilestone.name}`}
                </p>
              </div>

              <div style={styles.card}>
                <h3 style={styles.badgesTitle}>🎖️ Badge Collection</h3>
                <div style={styles.badgesGrid}>
                  {MILESTONES.map((m) => {
                    const earned = streak >= m.days;
                    return (
                      <div
                        key={m.days}
                        style={{
                          ...styles.badgeItem,
                          background: earned ? `${m.color}20` : undefined,
                          borderColor: earned ? m.color : undefined,
                          opacity: earned ? 1 : 0.5,
                        }}
                      >
                        <span style={styles.badgeIcon}>{m.icon}</span>
                        <div style={styles.badgeName}>{m.name}</div>
                        <div style={styles.badgeDays}>{m.days} Days</div>
                        <div style={styles.badgeStatus}>{earned ? "✅" : "🔒"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {message && (
        <div style={{ 
          ...styles.toast, 
          background: message.type === "success" ? "#10b981" : message.type === "error" ? "#ef4444" : "#6366f1" 
        }}>
          {message.text}
        </div>
      )}

      <footer style={styles.footer}>
        <p>⚡ Powered by Solana Blockchain</p>
        <p style={styles.disclaimer}>Streaks are stored on-chain and tamper-proof</p>
      </footer>
    </div>
  );
};

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
  walletBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none",
    padding: "14px 32px",
    fontSize: "1rem",
    fontWeight: "600",
    borderRadius: "12px",
    cursor: "pointer",
    color: "#fff",
  },
  connectedInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px",
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: "12px",
  },
  disconnectBtn: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1.2rem",
  },
  walletIcon: {
    width: "40px",
    height: "40px",
    background: "#10b981",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  walletLabel: { fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" },
  walletAddress: { fontWeight: "600", fontFamily: "monospace" },
  errorBanner: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid #ef4444",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    color: "#ef4444",
    textAlign: "center",
  },
  centerContent: { textAlign: "center" },
  sectionTitle: { fontSize: "1.25rem", fontWeight: "600", marginBottom: "12px" },
  sectionText: { color: "#94a3b8", marginBottom: "24px" },
  primaryBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    padding: "16px 32px",
    fontSize: "1rem",
    fontWeight: "600",
    borderRadius: "12px",
    cursor: "pointer",
    color: "#fff",
  },
  streakCircle: { textAlign: "center", padding: "20px 0", marginBottom: "20px" },
  streakNumber: { display: "block", fontSize: "4rem", fontWeight: "800", color: "#f8fafc" },
  streakLabel: { color: "#94a3b8", fontSize: "1rem" },
  claimBtn: {
    width: "100%",
    padding: "16px 24px",
    fontSize: "1.1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "16px",
  },
  statItem: {
    textAlign: "center",
    padding: "16px 12px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
  },
  statValue: { fontSize: "1.5rem", fontWeight: "700", color: "#818cf8" },
  statLabel: { fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", marginTop: "4px" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  progressTitle: { fontWeight: "600", fontSize: "1rem" },
  progressPercent: { fontWeight: "700", color: "#818cf8" },
  progressBarContainer: { height: "12px", background: "#334155", borderRadius: "6px", overflow: "hidden", marginBottom: "12px" },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #10b981)",
    borderRadius: "6px",
    transition: "width 0.5s ease",
  },
  progressText: { textAlign: "center", fontSize: "0.85rem", color: "#94a3b8" },
  badgesTitle: { fontSize: "1.1rem", fontWeight: "600", marginBottom: "20px" },
  badgesGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" },
  badgeItem: {
    textAlign: "center",
    padding: "20px 12px",
    borderRadius: "16px",
    border: "2px solid transparent",
  },
  badgeIcon: { fontSize: "2.5rem", display: "block", marginBottom: "12px" },
  badgeName: { fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" },
  badgeDays: { fontSize: "0.75rem", color: "#64748b" },
  badgeStatus: { marginTop: "12px", fontSize: "1.5rem" },
  toast: {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "16px 24px",
    borderRadius: "12px",
    fontWeight: "500",
    color: "#fff",
    zIndex: 1000,
  },
  footer: {
    textAlign: "center",
    padding: "32px 0 16px",
    borderTop: "1px solid #334155",
    marginTop: "24px",
    color: "#64748b",
    fontSize: "0.9rem",
  },
  disclaimer: { fontSize: "0.8rem", opacity: 0.7, marginTop: "8px" },
};
