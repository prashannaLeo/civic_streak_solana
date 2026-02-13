import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  getUserStreakPDA,
  initializeUserStreak,
  recordDailyEngagement,
  getUserStreak,
  UserStreakData,
  MILESTONES,
} from "../solana/client";

// Milestone configuration with gamification
const CIVIC_ACTIONS = [
  { id: "vote", name: "Vote on Poll", icon: "🗳️", points: 10 },
  { id: "read", name: "Read Issue Summary", icon: "📰", points: 5 },
  { id: "share", name: "Share Civic Content", icon: "📤", points: 8 },
  { id: "discuss", name: "Join Discussion", icon: "💬", points: 12 },
];

interface StreakData {
  streakCount: number;
  totalCivicPoints: number;
  badges: string[];
  completedActions: { id: string; date: Date }[];
  createdAt: Date;
  lastActionDate: Date;
}

export const StreakComponent: React.FC = () => {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { connection } = useConnection();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<UserStreakData | null>(null);
  const [localStreakData, setLocalStreakData] = useState<StreakData | null>(
    null,
  );
  const [hasAccount, setHasAccount] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info" | "achievement";
  } | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string }>
  >([]);
  const animationRef = useRef<number>();

  // Get PDA
  const getPDA = useCallback((userPublicKey: any) => {
    return getUserStreakPDA(userPublicKey);
  }, []);

  // Show message
  const showAppMessage = (
    text: string,
    type: "success" | "error" | "info" | "achievement",
  ) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Particle animation
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

  // Fetch streak data from blockchain
  const fetchAndSetStreakData = useCallback(async () => {
    if (!publicKey) return;

    try {
      const data = await getUserStreak(connection, publicKey);
      if (data) {
        setStreakData(data);
        setLocalStreakData({
          streakCount: data.streakCount,
          totalCivicPoints: data.milestoneClaimed * 50,
          badges: [],
          completedActions: [],
          createdAt: new Date(data.createdTs * 1000),
          lastActionDate: new Date(data.lastInteractionTs * 1000),
        });
        setHasAccount(true);
      } else {
        setStreakData(null);
        setLocalStreakData(null);
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

  // Cleanup animation
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize streak account
  const handleInitializeStreak = async () => {
    if (!publicKey) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const streakPDA = getPDA(publicKey);
      const existingAccount = await connection.getAccountInfo(streakPDA);

      if (existingAccount) {
        console.log("Account already exists!");
        setHasAccount(true);
        await fetchAndSetStreakData();
        showAppMessage("📊 Streak account already exists!", "info");
        setLoading(false);
        return;
      }

      console.log("Sending initializeUserStreak transaction...");
      const signature = await initializeUserStreak(
        connection,
        wallet,
        publicKey,
      );
      console.log("Signature:", signature);

      await fetchAndSetStreakData();
      showAppMessage("🎉 Streak account created!", "success");
      createParticles(window.innerWidth / 2, window.innerHeight / 2);
    } catch (err: any) {
      console.error("Error initializing streak:", err);
      setError(err.message || "Failed to initialize streak");
      showAppMessage(err.message || "Failed to initialize streak", "error");
    } finally {
      setLoading(false);
    }
  };

  // Record daily engagement
  const handleRecordEngagement = async () => {
    if (!publicKey) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log("Sending recordDailyEngagement transaction...");
      const signature = await recordDailyEngagement(
        connection,
        wallet,
        publicKey,
      );
      console.log("Signature:", signature);

      await fetchAndSetStreakData();
      showAppMessage("🔥 Daily civic action recorded!", "success");
      createParticles(window.innerWidth / 2, window.innerHeight / 2);
    } catch (err: any) {
      console.error("Error recording engagement:", err);

      if (err.message?.includes("already claimed")) {
        showAppMessage("⏰ You've already claimed today!", "error");
      } else {
        setError(err.message || "Failed to record engagement");
        showAppMessage(err.message || "Failed to record engagement", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Complete action
  const completeAction = async (action: (typeof CIVIC_ACTIONS)[0]) => {
    setLoading(true);
    setShowActionMenu(false);

    try {
      await handleRecordEngagement();

      const newStreak = (localStreakData?.streakCount || 0) + 1;
      const pointsEarned = action.points;

      // Update local state
      setLocalStreakData((prev) => ({
        ...prev!,
        streakCount: newStreak,
        totalCivicPoints: (prev?.totalCivicPoints || 0) + pointsEarned,
        completedActions: [
          ...(prev?.completedActions || []),
          { id: action.id, date: new Date() },
        ],
        lastActionDate: new Date(),
      }));

      showAppMessage(
        `✅ ${action.name} completed! +${action.points} points!`,
        "success",
      );
    } catch (err: any) {
      console.error("Error:", err);
      showAppMessage(err.message || "Error recording action", "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate milestones
  const streak = localStreakData?.streakCount || streakData?.streakCount || 0;
  const nextMilestone =
    MILESTONES.find((m) => streak < m.days) ||
    MILESTONES[MILESTONES.length - 1];
  const progressPercent = Math.min((streak / nextMilestone.days) * 100, 100);
  const earnedBadges = MILESTONES.filter((m) => streak >= m.days).map(
    (m) => m.days,
  );

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render
  return (
    <div style={styles.container}>
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            ...styles.particle,
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: p.color,
          }}
        />
      ))}

      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏛️</span>
          <h1 style={styles.title}>Civic Streak</h1>
        </div>
        <WalletMultiButton style={styles.walletButton} />
      </header>

      {/* Messages */}
      {message && (
        <div
          style={{
            ...styles.message,
            background:
              message.type === "success"
                ? "#10b981"
                : message.type === "error"
                  ? "#ef4444"
                  : message.type === "achievement"
                    ? "#f59e0b"
                    : "#6366f1",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {!connected ? (
        // Not connected
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Connect Your Wallet</h2>
          <p style={styles.sectionText}>
            Connect your Phantom wallet to start building your civic streak!
          </p>
          <WalletMultiButton style={styles.connectButton}>
            Connect Wallet
          </WalletMultiButton>
        </div>
      ) : !hasAccount ? (
        // No streak account
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>🚀 Start Your Civic Journey</h2>
          <p style={styles.sectionText}>
            Create your streak account on Solana blockchain!
          </p>
          <button
            style={styles.primaryButton}
            onClick={handleInitializeStreak}
            disabled={loading}
          >
            {loading ? "Creating..." : "Initialize Streak Account"}
          </button>
        </div>
      ) : (
        // Has streak account
        <>
          {/* Main streak card */}
          <div style={styles.streakCard}>
            <div style={styles.streakCircle}>
              <span style={styles.streakNumber}>{streak}</span>
              <span style={styles.streakLabel}>Day Streak</span>
            </div>
            <button
              style={styles.claimButton}
              onClick={handleRecordEngagement}
              disabled={loading}
            >
              {loading ? "Processing..." : "📅 Mark Today's Civic Action"}
            </button>
          </div>

          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{nextMilestone.days - streak}</div>
              <div style={styles.statLabel}>Days to {nextMilestone.name}</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{earnedBadges.length}</div>
              <div style={styles.statLabel}>Badges Earned</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>
                {localStreakData?.totalCivicPoints || 0}
              </div>
              <div style={styles.statLabel}>CIVIC Points</div>
            </div>
          </div>

          {/* Progress */}
          <div style={styles.card}>
            <div style={styles.progressHeader}>
              <span style={styles.progressTitle}>
                Progress to {nextMilestone.name}
              </span>
              <span style={styles.progressPercent}>
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <div style={styles.progressBarContainer}>
              <div
                style={{ ...styles.progressBar, width: `${progressPercent}%` }}
              />
            </div>
            <p style={styles.progressText}>
              {streak} / {nextMilestone.days} days
            </p>
          </div>

          {/* Milestones */}
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

          {/* Action button */}
          <button
            style={styles.actionButton}
            onClick={() => setShowActionMenu(true)}
            disabled={loading}
          >
            {loading ? "Processing..." : "📝 Record Civic Action"}
          </button>
        </>
      )}

      {/* Action menu modal */}
      {showActionMenu && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowActionMenu(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Choose an Action</h3>
            <p style={styles.modalSubtitle}>
              Complete a civic action to earn points
            </p>

            {CIVIC_ACTIONS.map((action) => (
              <button
                key={action.id}
                style={styles.actionItem}
                onClick={() => completeAction(action)}
                disabled={loading}
              >
                <span style={styles.actionIcon}>{action.icon}</span>
                <div style={styles.actionInfo}>
                  <p style={styles.actionName}>{action.name}</p>
                  <p style={styles.actionPoints}>+{action.points} points</p>
                </div>
              </button>
            ))}

            <button
              style={styles.modalClose}
              onClick={() => setShowActionMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background:
      "linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 50%, #1a1a2e 100%)",
    color: "#fff",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "20px",
  },
  particle: {
    position: "fixed",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 1000,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "40px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    fontSize: "36px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  walletButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  card: {
    maxWidth: "500px",
    margin: "0 auto 24px",
    padding: "32px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sectionText: {
    color: "#9ca3af",
    marginBottom: "24px",
    fontSize: "16px",
  },
  connectButton: {
    width: "100%",
    padding: "18px 32px",
    fontSize: "18px",
    fontWeight: 600,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "16px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  primaryButton: {
    width: "100%",
    padding: "16px 32px",
    fontSize: "16px",
    fontWeight: 600,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    borderRadius: "16px",
    color: "white",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  streakCard: {
    maxWidth: "400px",
    margin: "0 auto 24px",
    padding: "40px",
    background:
      "linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    borderRadius: "24px",
    textAlign: "center",
  },
  streakCircle: {
    marginBottom: "24px",
  },
  streakNumber: {
    fontSize: "72px",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "block",
  },
  streakLabel: {
    fontSize: "18px",
    color: "#9ca3af",
    marginTop: "8px",
  },
  claimButton: {
    width: "100%",
    padding: "16px 32px",
    fontSize: "16px",
    fontWeight: 600,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "16px",
    color: "white",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    maxWidth: "600px",
    margin: "0 auto 24px",
  },
  statItem: {
    padding: "20px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  statLabel: {
    fontSize: "14px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  progressTitle: {
    fontSize: "16px",
    fontWeight: 600,
  },
  progressPercent: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#667eea",
  },
  progressBarContainer: {
    height: "8px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  progressText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: "8px",
    fontSize: "14px",
  },
  badgesTitle: {
    textAlign: "center",
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: "16px",
    color: "#fff",
  },
  badgesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    maxWidth: "800px",
    margin: "0 auto 24px",
  },
  badgeItem: {
    padding: "20px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "2px solid",
    borderRadius: "16px",
    textAlign: "center",
    transition: "transform 0.2s",
  },
  badgeIcon: {
    fontSize: "36px",
    display: "block",
    marginBottom: "8px",
  },
  badgeName: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "4px",
  },
  badgeDays: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  badgeStatus: {
    fontSize: "12px",
    marginTop: "8px",
    color: "#9ca3af",
  },
  actionButton: {
    display: "block",
    maxWidth: "300px",
    margin: "0 auto",
    padding: "16px 32px",
    fontSize: "16px",
    fontWeight: 600,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    borderRadius: "16px",
    color: "white",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  message: {
    position: "fixed",
    top: "100px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "16px 32px",
    borderRadius: "12px",
    color: "#fff",
    fontWeight: 500,
    zIndex: 1000,
    maxWidth: "90%",
    textAlign: "center",
  },
  error: {
    position: "fixed",
    top: "100px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "16px 32px",
    borderRadius: "12px",
    background: "#ef4444",
    color: "#fff",
    fontWeight: 500,
    zIndex: 1000,
    maxWidth: "90%",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#1a1a2e",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    padding: "32px",
    width: "90%",
    maxWidth: "450px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  modalSubtitle: {
    color: "#9ca3af",
    marginBottom: "24px",
  },
  actionItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    width: "100%",
    padding: "18px 20px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    cursor: "pointer",
    textAlign: "left",
    marginBottom: "12px",
    color: "#fff",
    transition: "background 0.2s",
  },
  actionIcon: {
    fontSize: "24px",
  },
  actionInfo: {
    flex: 1,
  },
  actionName: {
    fontWeight: 600,
    margin: 0,
  },
  actionPoints: {
    fontSize: "14px",
    color: "#9ca3af",
    margin: 0,
  },
  modalClose: {
    width: "100%",
    padding: "16px",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#9ca3af",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "12px",
  },
};

export default StreakComponent;
