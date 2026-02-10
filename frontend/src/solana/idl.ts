// IDL for Civic Streak Anchor Program (Anchor 0.32.x format with metadata)
import { Program } from "@coral-xyz/anchor";

export const civicStreakIdl = {
  version: "0.1.0",
  name: "civic_streak",
  instructions: [
    {
      name: "initializeUserStreak",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "userStreak", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "recordDailyEngagement",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "userStreak", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "getUserStreak",
      accounts: [
        { name: "user", isMut: false, isSigner: true },
        { name: "userStreak", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "UserStreak",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "pubkey" },
          { name: "streakCount", type: "u64" },
          { name: "lastInteractionTs", type: "i64" },
          { name: "createdTs", type: "i64" },
          { name: "milestoneClaimed", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "AlreadyClaimedToday", msg: "You have already claimed your civic action for today. Come back tomorrow!" },
    { code: 6001, name: "StreakExpired", msg: "Your streak has expired. Start a new streak today!" },
  ],
  metadata: {
    address: "AcwHoN69JyVtJ9S82YbkJaW3Xd1eksUKCgRCfftc8A7X",
  },
};
