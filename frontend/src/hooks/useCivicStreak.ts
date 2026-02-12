import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  initializeUserStreak,
  recordDailyEngagement,
  getUserStreak,
} from "../solana/client";

export interface UserStreakData {
  user: string;
  streakCount: number;
  lastInteractionTs: number;
  createdTs: number;
  milestoneClaimed: number;
}

export const useCivicStreak = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<UserStreakData | null>(null);

  // Initialize streak account
  const initializeStreak = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await initializeUserStreak(
        connection,
        wallet,
        wallet.publicKey,
      );
      console.log("Transaction signature:", tx);

      // Fetch updated streak data
      const data = await getUserStreak(connection, wallet.publicKey);
      setStreakData(data);

      return tx;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      console.error("Initialize streak error:", err);
    } finally {
      setLoading(false);
    }
  }, [wallet, connection]);

  // Record daily engagement
  const recordEngagement = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await recordDailyEngagement(
        connection,
        wallet,
        wallet.publicKey,
      );
      console.log("Transaction signature:", tx);

      // Fetch updated streak data
      const data = await getUserStreak(connection, wallet.publicKey);
      setStreakData(data);

      return tx;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      console.error("Record engagement error:", err);
    } finally {
      setLoading(false);
    }
  }, [wallet, connection]);

  // Fetch current streak data
  const fetchStreakData = useCallback(async () => {
    if (!wallet.publicKey) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUserStreak(connection, wallet.publicKey);
      setStreakData(data);

      return data;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      console.error("Fetch streak data error:", err);
    } finally {
      setLoading(false);
    }
  }, [wallet, connection]);

  return {
    loading,
    error,
    streakData,
    initializeStreak,
    recordEngagement,
    fetchStreakData,
    isConnected: wallet.connected,
  };
};
