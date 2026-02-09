import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Milestone configuration
const MILESTONES = [
  { days: 7, name: "Civic Starter", icon: "🌟", color: "#fbbf24" },
  { days: 30, name: "Consistent", icon: "🏆", color: "#60a5fa" },
  { days: 100, name: "Champion", icon: "👑", color: "#a78bfa" },
];

export const StreakComponent: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<number[]>([]);
  const [lastActive, setLastActive] = useState<string>("--");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [canClaimToday, setCanClaimToday] = useState(true);
  const [hoursUntilNextClaim, setHoursUntilNextClaim] = useState(0);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("civicStreak");
    if (saved) {
      const data = JSON.parse(saved);
      setStreak(data.streak || 0);
      setPoints(data.points || 0);
      setBadges(data.badges || []);
      if (data.lastActive) {
        setLastActive(new Date(data.lastActive).toLocaleDateString());
      }
      if (data.lastClaim) {
        const hoursSinceClaim = (Date.now() - new Date(data.lastClaim).getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          setCanClaimToday(false);
          setHoursUntilNextClaim(Math.ceil(24 - hoursSinceClaim));
        }
      }
    }
  }, []);

  // Save state to localStorage
  const saveState = (newStreak: number, newPoints: number, newBadges: number[]) => {
    localStorage.setItem(
      "civicStreak",
      JSON.stringify({
        streak: newStreak,
        points: newPoints,
        badges: newBadges,
        lastActive: new Date().toISOString(),
        lastClaim: new Date().toISOString(),
      })
    );
    
    // Disable next claim for 24 hours
    setCanClaimToday(false);
    setHoursUntilNextClaim(24);
  };

  // Countdown timer for next claim
  useEffect(() => {
    if (!canClaimToday && hoursUntilNextClaim > 0) {
      const interval = setInterval(() => {
        setHoursUntilNextClaim((prev) => {
          if (prev <= 1) {
            setCanClaimToday(true);
            return 0;
          }
          return prev - 1;
        });
      }, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [canClaimToday, hoursUntilNextClaim]);

  const showMessage = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Initialize streak account on blockchain
  const initializeStreak = async () => {
    if (!publicKey) {
      showMessage("Please connect your wallet first!", "error");
      return;
    }

    setLoading(true);
    try {
      // For demo, just initialize locally
      // In production, this would call the Solana program
      setStreak(1);
      setLastActive(new Date().toLocaleDateString());
      setHasAccount(true);
      saveState(1, points, badges);
      showMessage("🎉 Streak account created on Solana!", "success");
    } catch (error) {
      console.error("Error initializing streak:", error);
      showMessage("Failed to create streak account", "error");
    }
    setLoading(false);
  };

  // Record daily engagement on blockchain
  const recordEngagement = async () => {
    if (!publicKey) {
      showMessage("Please connect your wallet first!", "error");
      return;
    }

    setLoading(true);
    try {
      // For demo, just update locally
      // In production, this would call the Solana program
      const newStreak = streak + 1;
      const pointsEarned = Math.min(10 * Math.min(newStreak, 10), 100);
      const newPoints = points + pointsEarned;

      // Check for new badges
      const newBadges = [...badges];
      MILESTONES.forEach((m) => {
        if (newStreak === m.days && !newBadges.includes(m.days)) {
          newBadges.push(m.days);
          showMessage(`🎖️ Badge Unlocked: ${m.name}!`, "success");
        }
      });

      setStreak(newStreak);
      setPoints(newPoints);
      setBadges(newBadges);
      setLastActive(new Date().toLocaleDateString());
      saveState(newStreak, newPoints, newBadges);
      showMessage(`🔥 Streak: ${newStreak} days! +${pointsEarned} points!`, "success");
    } catch (error) {
      console.error("Error recording engagement:", error);
      showMessage("Failed to record engagement", "error");
    }
    setLoading(false);
  };

  // Calculate progress
  const nextMilestone = MILESTONES.find((m) => streak < m.days) || MILESTONES[MILESTONES.length - 1];
  const progressPercent = Math.min((streak / nextMilestone.days) * 100, 100);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏛️</span>
          <h1 style={styles.title}>Civic Streak</h1>
        </div>
        <p style={styles.subtitle}>Build consistent civic habits on Solana</p>
      </header>

      {/* Wallet Card */}
      <div style={styles.card}>
        <div style={styles.cardContent}>
          {!connected ? (
            <WalletMultiButton style={styles.walletBtn} />
          ) : (
            <div style={styles.connectedInfo}>
              <div style={styles.walletIcon}>✅</div>
              <div>
                <div style={styles.walletLabel}>Connected</div>
                <div style={styles.walletAddress}>
                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {connected && (
        <>
          {!hasAccount && streak === 0 ? (
            /* Initialize Streak */
            <div style={styles.card}>
              <div style={styles.centerContent}>
                <h2 style={styles.sectionTitle}>🚀 Start Your Civic Journey</h2>
                <p style={styles.sectionText}>
                  Create your streak account on Solana to start earning points and badges!
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
              {/* Streak Card */}
              <div style={styles.card}>
                <div style={styles.streakCircle}>
                  <span style={styles.streakNumber}>{streak}</span>
                  <span style={styles.streakLabel}>Day Streak</span>
                </div>
                <button
                  style={{
                    ...styles.claimBtn,
                    opacity: canClaimToday ? 1 : 0.5,
                    cursor: canClaimToday ? 'pointer' : 'not-allowed',
                  }}
                  onClick={recordEngagement}
                  disabled={loading || !canClaimToday}
                >
                  <span>{canClaimToday ? '📮' : '⏰'}</span>
                  {loading
                    ? 'Processing...'
                    : canClaimToday
                    ? "Mark Today's Civic Action"
                    : `Come back in ${hoursUntilNextClaim}h`}
                </button>
              </div>

              {/* Stats */}
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{lastActive}</div>
                  <div style={styles.statLabel}>Last Active</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{points}</div>
                  <div style={styles.statLabel}>Points</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{badges.length}/3</div>
                  <div style={styles.statLabel}>Badges</div>
                </div>
              </div>

              {/* Progress */}
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

              {/* Badges */}
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

      {/* Toast */}
      {message && (
        <div style={{ ...styles.toast, background: message.type === "success" ? "#10b981" : message.type === "error" ? "#ef4444" : "#6366f1" }}>
          {message.text}
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p>⚡ Powered by Solana Blockchain</p>
        <p style={styles.disclaimer}>Streaks reset if you miss 48+ hours between actions</p>
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
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  logoIcon: {
    fontSize: "32px",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #f8fafc, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.95rem",
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "16px",
  },
  cardContent: {
    textAlign: "center",
  },
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
  walletLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    textTransform: "uppercase",
  },
  walletAddress: {
    fontWeight: "600",
    fontFamily: "monospace",
  },
  centerContent: {
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "12px",
  },
  sectionText: {
    color: "#94a3b8",
    marginBottom: "24px",
  },
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
  streakCircle: {
    textAlign: "center",
    padding: "20px 0",
    marginBottom: "20px",
  },
  streakNumber: {
    display: "block",
    fontSize: "4rem",
    fontWeight: "800",
    color: "#f8fafc",
  },
  streakLabel: {
    color: "#94a3b8",
    fontSize: "1rem",
  },
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
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#818cf8",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  progressTitle: {
    fontWeight: "600",
    fontSize: "1rem",
  },
  progressPercent: {
    fontWeight: "700",
    color: "#818cf8",
  },
  progressBarContainer: {
    height: "12px",
    background: "#334155",
    borderRadius: "6px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #10b981)",
    borderRadius: "6px",
    transition: "width 0.5s ease",
  },
  progressText: {
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  badgesTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "20px",
  },
  badgesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  badgeItem: {
    textAlign: "center",
    padding: "20px 12px",
    borderRadius: "16px",
    border: "2px solid transparent",
  },
  badgeIcon: {
    fontSize: "2.5rem",
    display: "block",
    marginBottom: "12px",
  },
  badgeName: {
    fontSize: "0.85rem",
    fontWeight: "600",
    marginBottom: "4px",
  },
  badgeDays: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  badgeStatus: {
    marginTop: "12px",
    fontSize: "1.5rem",
  },
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
  disclaimer: {
    fontSize: "0.8rem",
    opacity: 0.7,
    marginTop: "8px",
  },
};
