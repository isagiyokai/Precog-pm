# Arcium MXE - Market Resolution

This directory contains the **Multi-Party Execution Environment (MXE)** code for resolving prediction markets privately using Arcium's encrypted computing infrastructure.

## Overview

The MXE receives encrypted bets from users and computes the market outcome **without revealing individual bets to any party**. The computation happens under Multi-Party Computation (MPC), ensuring privacy.

## How It Works

1. **Input**: Encrypted bets + optional oracle data
2. **MPC Processing**: 
   - Decrypt bets within MPC (no single party sees cleartext)
   - Aggregate pools (YES vs NO)
   - Determine winning outcome
   - Calculate proportional payouts
3. **Output**: Signed, verifiable result with payout list

## Building

```bash
cargo build --release --target wasm32-unknown-unknown
```

## Deployment

```bash
# Deploy to Arcium testnet
../scripts/deploy_mxe.sh
```

## Testing

```bash
cargo test
```

## Integration

The MXE is called from the Solana program via Arcium's orchestration layer. See `/backend` for integration code.

## TODO

- [ ] Replace MPC simulation with actual Arcium SDK
- [ ] Implement proper signature verification
- [ ] Add support for multi-outcome markets
- [ ] Optimize for gas efficiency
