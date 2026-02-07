import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCivicStreak } from "../hooks/useCivicStreak";

export const StreakComponent: React.FC = () => {
  const {
    loading,
    error,
    streakData,
    initializeStreak,
    recordEngagement,
    fetchStreakData,
    isConnected,
  } = useCivicStreak();

  React.useEffect(() => {
    if (isConnected) {
      fetchStreakData();
    }
  }, [isConnected, fetchStreakData]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🏛️ Civic Streak</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <WalletMultiButton />
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          ❌ Error: {error}
        </div>
      )}

      {loading && <p>⏳ Loading...</p>}

      {isConnected && !streakData && (
        <div>
          <p>No streak account found. Create one to get started!</p>
          <button
            onClick={initializeStreak}
            disabled={loading}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "🚀 Initialize Streak"}
          </button>
        </div>
      )}

      {streakData && (
        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h2>🔥 Your Streak</h2>
          <div>
            <p>
              <strong>Current Streak:</strong> {streakData.streakCount} days
            </p>
            <p>
              <strong>Last Interaction:</strong>{" "}
              {new Date(Number(streakData.lastInteractionTs) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>Account Created:</strong>{" "}
              {new Date(Number(streakData.createdTs) * 1000).toLocaleString()}
            </p>
          </div>

          <button
            onClick={recordEngagement}
            disabled={loading}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Recording..." : "📝 Record Daily Action"}
          </button>
        </div>
      )}
    </div>
  );
};
