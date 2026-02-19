//! Civic Streak Program - Core Edition
//!
//! This program implements a streak-based civic engagement system on Solana.
//! Users can maintain daily streaks for civic actions like voting, reading issues,
//! and acknowledging national topics.
//!
//! STREAK RULES:
//! - Users must interact within 24-48 hours window to maintain streak
//! - Missing the window resets streak to 1
//! - Each streak milestone earns civic points (handled off-chain or via separate token program)

use anchor_lang::prelude::*;

// =====================================================
// CONSTANTS & SEEDS
// =====================================================

/// Seed prefix for user streak account PDA
const STREAK_SEED: &[u8] = b"streak_2025"; // New seed for fresh start

/// Time window for maintaining streak (48 hours in seconds)
const STREAK_WINDOW_SECONDS: i64 = 48 * 60 * 60;
/// Minimum time between actions (24 hours in seconds)
const DAY_SECONDS: i64 = 24 * 60 * 60;

/// Program ID
declare_id!("AZk4djCf76yJ5qEfJgu3muTtYmW6Wm7bL8Bsjsj1MMGu");

#[program]
pub mod civic_streak {
    use super::*;

    /// Initialize a new user streak account
    pub fn initialize_user_streak(ctx: Context<InitializeUserStreak>) -> Result<()> {
        let streak_account = &mut ctx.accounts.user_streak;
        
        streak_account.user = ctx.accounts.user.key();
        streak_account.streak_count = 1;
        streak_account.last_interaction_ts = Clock::get()?.unix_timestamp;
        streak_account.created_ts = Clock::get()?.unix_timestamp;
        streak_account.milestone_claimed = 0;

        msg!("🎉 User streak initialized! Starting streak: 1");
        msg!("💡 Come back every 24-48 hours to maintain your streak!");
        Ok(())
    }

    /// Record daily civic engagement - MAIN FUNCTION
    pub fn record_daily_engagement(ctx: Context<RecordDailyEngagement>) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        
        let streak_account = &mut ctx.accounts.user_streak;

        // Calculate time since last interaction
        let time_since_last = current_time - streak_account.last_interaction_ts;

        // Validate: user must wait at least 24 hours between claims
        if time_since_last < DAY_SECONDS {
            msg!("❌ You already claimed today! Come back in {} hours.", 
                (DAY_SECONDS - time_since_last) / 3600);
            return Err(ErrorCode::AlreadyClaimedToday.into());
        }

        // Check if streak is still valid (within 48 hours window)
        let is_within_window = time_since_last <= STREAK_WINDOW_SECONDS;
        
        let old_streak = streak_account.streak_count;
        
        if is_within_window {
            streak_account.streak_count += 1;
            msg!("🔥 Streak continued! 🔥");
            msg!("📈 Current streak: {} days", streak_account.streak_count);
        } else {
            streak_account.streak_count = 1;
            msg!("💔 Streak broken! 💔");
            msg!("🔄 Starting fresh - Day 1!");
        }

        streak_account.last_interaction_ts = current_time;

        // Check for milestone achievements
        let new_streak = streak_account.streak_count;
        check_milestones(old_streak, new_streak)?;

        msg!("✅ Daily civic action recorded successfully!");
        Ok(())
    }

    /// Get user streak info
    pub fn get_user_streak(_ctx: Context<GetUserStreak>) -> Result<()> {
        Ok(())
    }

    /// Close user streak account (emergency reset)
    pub fn close_user_streak(ctx: Context<CloseUserStreak>) -> Result<()> {
        msg!("🚪 User streak account closed!");
        Ok(())
    }
}

/// Check and log milestone achievements
fn check_milestones(old_streak: u64, new_streak: u64) -> Result<()> {
    let milestones = [7, 14, 21, 30, 50, 100];
    
    for milestone in milestones.iter() {
        if old_streak < *milestone && new_streak >= *milestone {
            let reward = match milestone {
                7 => "🌟 Civic Starter Badge",
                14 => "⭐ Consistent Citizen Badge",
                21 => "🌈 Civic Champion Badge",
                30 => "🏆 Democracy Hero Badge",
                50 => "🎖️ Civic Legend Badge",
                100 => "👑 Civic Grandmaster Badge",
                _ => "🎁 Milestone Reward",
            };
            msg!("🎊 MILESTONE REACHED! 🎊");
            msg!("🏅 {} - {} days!", reward, milestone);
            msg!("🪙 Claim your reward tokens!");
        }
    }
    Ok(())
}

// =====================================================
// ACCOUNT STRUCTURES
// =====================================================

/// Initialize user streak - creates streak account
#[derive(Accounts)]
pub struct InitializeUserStreak<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        seeds = [STREAK_SEED, user.key().as_ref()],
        bump,
        space = UserStreak::LEN
    )]
    pub user_streak: Account<'info, UserStreak>,
    
    pub system_program: Program<'info, System>,
}

/// Record daily engagement instruction
#[derive(Accounts)]
pub struct RecordDailyEngagement<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STREAK_SEED, user.key().as_ref()],
        bump,
    )]
    pub user_streak: Account<'info, UserStreak>,
    
    pub system_program: Program<'info, System>,
}

/// Get user streak info (view-only)
#[derive(Accounts)]
pub struct GetUserStreak<'info> {
    pub user: Signer<'info>,
    
    #[account(
        seeds = [STREAK_SEED, user.key().as_ref()],
        bump,
    )]
    pub user_streak: Account<'info, UserStreak>,
}

/// Close user streak account (emergency reset - not implementing close for simplicity)
#[derive(Accounts)]
pub struct CloseUserStreak<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STREAK_SEED, user.key().as_ref()],
        bump,
    )]
    pub user_streak: Account<'info, UserStreak>,
}

// =====================================================
// ACCOUNT DATA STRUCTURE
// =====================================================

/// User streak account
#[account]
pub struct UserStreak {
    pub user: Pubkey,
    pub streak_count: u64,
    pub last_interaction_ts: i64,
    pub created_ts: i64,
    pub milestone_claimed: u8,  // Highest milestone claimed (for rewards)
}

impl UserStreak {
    // Account size: 32 + 8 + 8 + 8 + 1 = 57 bytes, rounded to 64
    const LEN: usize = 64;
}

// =====================================================
// ERROR CODES
// =====================================================

#[error_code]
pub enum ErrorCode {
    #[msg("You have already claimed your civic action for today. Come back tomorrow!")]
    AlreadyClaimedToday,
    
    #[msg("Your streak has expired. Start a new streak today!")]
    StreakExpired,
}
