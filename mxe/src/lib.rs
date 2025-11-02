mod resolve_market;

pub use resolve_market::{
    resolve_market, 
    MXEInput, 
    MXEOutput, 
    MarketResult, 
    Payout,
    EncryptedBet,
    OracleReport
};

// Re-export main entry point for WASM
pub use resolve_market::execute_mxe;
