use anchor_lang::prelude::*;

declare_id!("6HB2F1y9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9");

#[program]
pub module token_escrow {
    use super::*;

    pub fn initialize_escrow(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.amount = amount;
        escrow.owner = ctx.accounts.owner.key();
        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        // VULNERABILITY: Missing Signer Check
        // The claimer should be the signer, and it should be the owner.
        // Currently, anyone can call claim and trigger the logic.
        
        let amount = escrow.amount;
        escrow.amount = 0;

        // CPI to transfer tokens... (omitted for brevity)
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 8)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    /// CHECK: This is the destination
    pub destination: AccountInfo<'info>,
}

#[account]
pub struct Escrow {
    pub owner: Pubkey,
    pub amount: u64,
}
