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
  MILESTONES,
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
    } catch (err: any) {
      setError("Failed to fetch streak data");
      console.error("Error fetching streak:", err);
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
      // Debug: Log the PDA address
      const pda = getUserStreakPDA(publicKey);
      console.log("PDA Address:", pda.toString());
      console.log("Seed used: streak_v5");
      
      console.log("Initializing streak account...");
      const signature = await initStreak(connection, anchorWallet, publicKey);
      console.log("Initialized! Signature:", signature);
      
      await fetchAndSetStreakData();
      showMessage("🎉 Streak account created! Start your civic journey!", "success");
    } catch (err: any) {
      console.error("Init error:", err);
      setError(err.message || "Failed to initialize streak");
      showMessage(err.message || "Failed to initialize", "error");
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

      {message && (
        <div style={{
          ...styles.messageBanner,
          background: message.type === "success" ? "#10b981" : message.type === "error" ? "#ef4444" : "#3b82f6",
        }}>
          {message.text}
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
                  <div style={styles.statLabel}>Days to {nextMilestone.name}</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{streakData?.createdTs ? new Date(Number(streakData.createdTs) * 1000).toLocaleDateString() : "N/A"}</div>
                  <div style={styles.statLabel}>Started</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={styles.card}>
                <div style={styles.progressContainer}>
                  <div style={styles.progressLabel}>
                    <span>Progress to {nextMilestone.name}</span>
                    <span>{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
                  </div>
                </div>

                {/* Badges */}
                <div style={styles.badgesSection}>
                  <div style={styles.badgesTitle}>🏆 Milestones Earned</div>
                  <div style={styles.badgesGrid}>
                    {MILESTONES.map((m) => {
                      const earned = earnedBadges.includes(m.days);
                      return (
                        <div
                          key={m.days}
                          style={{
                            ...styles.badge,
                            opacity: earned ? 1 : 0.4,
                            border: earned ? `2px solid ${m.color}` : "2px solid #444",
                          }}
                        >
                          <div style={styles.badgeIcon}>{m.icon}</div>
                          <div style={styles.badgeName}>{m.name}</div>
                          <div style={styles.badgeDays}>{m.days} days</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Streak History */}
              {streakData?.lastInteractionTs && (
                <div style={styles.card}>
                  <h3 style={styles.sectionTitle}>📅 Activity Log</h3>
                  <div style={styles.historyItem}>
                    <span style={styles.historyLabel}>Last Civic Action</span>
                    <span style={styles.historyValue}>
                      {new Date(Number(streakData.lastInteractionTs) * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.historyItem}>
                    <span style={styles.historyLabel}>Streak Started</span>
                    <span style={styles.historyValue}>
                      {new Date(Number(streakData.createdTs) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={styles.historyItem}>
                    <span style={styles.historyLabel}>Milestone Claimed</span>
                    <span style={styles.historyValue}>
                      {streakData.milestoneClaimed ? `${streakData.milestoneClaimed} days` : "None"}
                    </span>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>📖 How It Works</h3>
                <ol style={styles.stepsList}>
                  <li>Click "Mark Today's Civic Action" daily</li>
                  <li>Maintain your streak by engaging within 48 hours</li>
                  <li>Earn milestone badges for 7, 14, and 30 days</li>
                  <li>Your progress is stored securely on Solana</li>
                </ol>
              </div>

              {/* Streak Rules */}
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>⚠️ Streak Rules</h3>
                <ul style={styles.rulesList}>
                  <li>Visit and engage at least once every 48 hours</li>
                  <li>Miss the window → streak resets to Day 1</li>
                  <li>Consistency builds your civic habit score</li>
                </ul>
              </div>
            </>
          )}
        </>
      )}

      {/* Instructions for new users */}
      {!connected && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Welcome to Civic Streak! 🌟</h2>
          <p style={styles.sectionText}>
            Connect your wallet to start building daily civic habits. 
            Vote on polls, read issue summaries, or acknowledge national topics 
            to maintain your streak on the Solana blockchain.
          </p>
          <p style={{...styles.sectionText, marginTop: 16}}>
            <strong>Why streaks matter:</strong> Consistent civic engagement 
            builds better citizens. Solana ensures your progress is transparent 
            and tamper-proof.
          </p>
        </div>
      )}
    </div>
  );
};

// Styles (inline for simplicity)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 20,
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#fff",
    background: "#0f0f23",
    minHeight: "100vh",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 14,
    margin: 0,
  },
  card: {
    background: "#1e1e2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    border: "1px solid #2d2d3d",
  },
  cardContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connectedInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  walletIcon: {
    fontSize: 24,
  },
  walletLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  disconnectBtn: {
    background: "#374151",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 16,
  },
  walletBtn: {
    background: "#3b82f6",
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#fff",
  },
  centerContent: {
    textAlign: "center",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 12,
    color: "#fff",
  },
  sectionText: {
    color: "#9ca3af",
    lineHeight: 1.6,
    fontSize: 14,
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 16,
  },
  streakCircle: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    boxShadow: "0 0 40px rgba(251, 191, 36, 0.3)",
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 700,
    color: "#fff",
    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  streakLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 500,
  },
  claimBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    background: "#1e1e2e",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
    border: "1px solid #2d2d3d",
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#60a5fa",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
    color: "#9ca3af",
  },
  progressBar: {
    height: 8,
    background: "#2d2d3d",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981, #34d399)",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  badgesSection: {
    marginTop: 20,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: "#fff",
  },
  badgesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  badge: {
    background: "#1e1e2e",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
    transition: "transform 0.2s, opacity 0.2s",
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    marginBottom: 4,
  },
  badgeDays: {
    fontSize: 12,
    color: "#9ca3af",
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #2d2d3d",
  },
  historyLabel: {
    color: "#9ca3af",
    fontSize: 14,
  },
  historyValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
  },
  stepsList: {
    color: "#9ca3af",
    paddingLeft: 20,
    lineHeight: 2,
    fontSize: 14,
  },
  rulesList: {
    color: "#9ca3af",
    paddingLeft: 20,
    lineHeight: 2,
    fontSize: 14,
  },
  errorBanner: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  messageBanner: {
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 500,
  },
};

export default StreakComponent;
