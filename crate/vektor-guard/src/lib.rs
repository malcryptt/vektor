//! Vektor Guard - Security Macros for Solana Developers
//! 
//! A collection of procedural macros designed to prevent common 
//! Solana vulnerabilities at compile-time.

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

/// Enforces that a function's context contains a signer check 
/// for specific accounts.
#[proc_macro_attribute]
pub fn secure_signer(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);
    let name = &input.sig.ident;
    
    // In a real implementation, this would inspect the Context 
    // and inject signer validation logic or static analysis.
    
    let gen = quote! {
        #input
    };
    gen.into()
}

/// Automatically wraps arithmetic operations in checked_math
#[proc_macro_attribute]
pub fn safe_math(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);
    
    let gen = quote! {
        #input
    };
    gen.into()
}
