import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  getProgram,
  getUserStreakPDA,
  initializeStreak as initStreak,
  recordDailyEngagement as recordEngagement,
  fetchStreakData,
  UserStreakData,
  MILESTONES
} from "../solana/client";

// Milestone configuration (imported from client.ts)

// Program ID from environment variable
const PROGRAM_ID = new PublicKey(
  typeof import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID === "string" && import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    ? import.meta.env.VITE_CIVIC_STREAK_PROGRAM_ID
    : "AcwHoN69JyVtJ9S82YbkJaW3Xd1eksUKCgRCfftc8A7X"
);

export const StreakComponent: React.FC = () => {
  const { publicKey, connected, disconnect, disconnecting, sendTransaction } = useWallet();
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
    } catch (err) {
      console.error("Error fetching streak:", err);
      setError("Failed to fetch streak data from blockchain");
    }
  }, [publicKey, connection]);

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
      }

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
