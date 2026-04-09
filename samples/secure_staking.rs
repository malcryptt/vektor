use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("H6HB2F1y9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v");

#[program]
pub module secure_staking {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.total_staked = 0;
        pool.last_update = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;

        // SECURE: Signer check is handled by Anchor's Signer<'info> type
        // SECURE: Checked math for addition
        pool.total_staked = pool.total_staked.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        user_stake.amount = user_stake.amount.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = admin, space = 8 + 8 + 8)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(init_if_needed, payer = user, space = 8 + 8, seeds = [b"stake", user.key().as_ref()], bump)]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pool {
    pub total_staked: u64,
    pub last_update: i64,
}

#[account]
pub struct UserStake {
    pub amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Calculation overflow.")]
    Overflow,
}
