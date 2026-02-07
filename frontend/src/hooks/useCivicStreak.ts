import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  getProgram,
  initializeUserStreak,
  recordDailyEngagement,
  getUserStreak,
} from "../solana/client";

export interface UserStreakData {
  user: string;
  streakCount: string;
  lastInteractionTs: string;
  createdTs: string;
  milestoneClaimed: string;
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
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getProgram(provider);

      const tx = await initializeUserStreak(program, wallet.publicKey);
      console.log("Transaction signature:", tx);

      // Fetch updated streak data
      const data = await getUserStreak(program, wallet.publicKey);
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
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getProgram(provider);

      const tx = await recordDailyEngagement(program, wallet.publicKey);
      console.log("Transaction signature:", tx);

      // Fetch updated streak data
      const data = await getUserStreak(program, wallet.publicKey);
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
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getProgram(provider);

      const data = await getUserStreak(program, wallet.publicKey);
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
