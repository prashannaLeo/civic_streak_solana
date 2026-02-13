import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  initializeUserStreak,
  recordDailyEngagement,
  fetchUserStreakData,
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

  const [streakData, setStreakData] = useState<UserStreakData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (!wallet.publicKey) return;

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
      const data = await fetchUserStreakData(connection, wallet.publicKey);
      setStreakData(data);

      return tx;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  const recordEngagement = useCallback(async () => {
    if (!wallet.publicKey) return;

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
      const data = await fetchUserStreakData(connection, wallet.publicKey);
      setStreakData(data);

      return tx;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  const fetchStreak = useCallback(async () => {
    if (!wallet.publicKey) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchUserStreakData(connection, wallet.publicKey);
      setStreakData(data);

      return data;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  return {
    streakData,
    loading,
    error,
    initialize,
    recordEngagement,
    fetchStreak,
  };
};
