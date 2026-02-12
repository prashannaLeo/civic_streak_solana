// IDL for Civic Streak Anchor Program (Anchor 0.32.x format)
// Program ID is read from VITE_CIVIC_STREAK_PROGRAM_ID in .env
import { Program } from "@coral-xyz/anchor";

export const civicStreakIdl = {
  version: "0.1.0",
  name: "civic_streak",
  instructions: [
    {
      name: "initializeUserStreak",
      discriminator: [0x9d, 0x98, 0x88, 0x79, 0x0c, 0xa2, 0x38, 0x45],
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "userStreak", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "recordDailyEngagement",
      discriminator: [0x4a, 0xd6, 0x04, 0xcc, 0x54, 0xce, 0x9b, 0xbf],
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "userStreak", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "getUserStreak",
      discriminator: [0x1d, 0x84, 0xb7, 0x2d, 0x7e, 0x4c, 0x1a, 0xb5],
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
      discriminator: [0xaa, 0x8c, 0x8d, 0x5a, 0x4a, 0x6c, 0x7d, 0x01],
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
    {
      code: 6000,
      name: "AlreadyClaimedToday",
      msg: "You have already claimed your civic action for today. Come back tomorrow!",
    },
    {
      code: 6001,
      name: "StreakExpired",
      msg: "Your streak has expired. Start a new streak today!",
    },
  ],
};
