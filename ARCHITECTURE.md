# Precog Architecture

## System Overview

```
┌─────────────┐
│   Frontend  │  (Next.js + Solana Wallet)
│  (React UI) │
└──────┬──────┘
       │
       │ HTTPS/WebSocket
       │
┌──────▼──────┐
│   Backend   │  (Node.js + Express)
│  API Server │
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       │                 │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Solana    │  │   Arcium    │  │  Database   │
│   Devnet    │  │   Testnet   │  │ (PostgreSQL)│
│  (Anchor)   │  │    (MXE)    │  │  (Optional) │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Component Breakdown

### 1. Frontend (Next.js)
**Location**: `/frontend`

**Responsibilities**:
- User authentication via Solana wallet
- Market browsing and creation UI
- Bet placement interface
- Encrypted data submission
- Real-time market updates

**Key Technologies**:
- Next.js 14
- Solana Wallet Adapter
- Arcium Arcis SDK (for client-side encryption)
- TailwindCSS

### 2. Backend API (Node.js/Express)
**Location**: `/backend`

**Responsibilities**:
- REST API endpoints
- Solana program interaction
- Arcium MXE job orchestration
- Data encryption/decryption coordination
- Optional data caching

**Key Services**:
- **solanaService.ts**: Anchor program RPC calls
- **arciumService.ts**: MXE job management
- **encryptionService.ts**: Encryption utilities

**API Endpoints**:
```
POST   /api/markets/create
POST   /api/markets/:id/bet
POST   /api/markets/:id/resolve
GET    /api/markets/:id
GET    /api/markets/:id/job-status
GET    /api/users/:pubkey/bets
```

### 3. Solana Anchor Program
**Location**: `/programs/market_factory`

**On-Chain State**:
```rust
Market {
    creator: Pubkey,
    question: String,
    deadline: i64,
    mxe_program_id: Pubkey,
    escrow_vault: Pubkey,
    total_pool: u64,
    state: MarketState,
    bet_count: u64,
}

BetLog {
    market: Pubkey,
    depositor: Pubkey,
    amount: u64,
    encrypted_blob: Vec<u8>,  // <-- Privacy!
    timestamp: i64,
}

ResolutionJob {
    market: Pubkey,
    status: JobStatus,
    callback_account: Pubkey,
}
```

**Instructions**:
1. `create_market`: Initialize market + escrow
2. `deposit_bet`: Lock funds, store encrypted bet
3. `enqueue_resolution`: Create Arcium job
4. `callback_settle`: Verify MXE result, distribute funds
5. `cancel_market`: Cancel if no bets

### 4. Arcium MXE (Encrypted Compute)
**Location**: `/mxe`

**Purpose**: 
Privately compute market outcomes without revealing individual bets.

**MPC Flow**:
```
1. Receive encrypted bets
2. Decrypt within MPC (no single node sees plaintext)
3. Aggregate pools (YES vs NO)
4. Determine winner
5. Calculate proportional payouts
6. Sign result
7. Return to Solana program
```

**Input**:
```json
{
  "market_id": "...",
  "encrypted_bets": [
    {
      "depositor_pubkey": "...",
      "encrypted_blob": "...",
      "amount": 1000000
    }
  ],
  "fee_bps": 50
}
```

**Output**:
```json
{
  "result": {
    "market_id": "...",
    "winning_choice": 1,
    "total_pool": 5000000,
    "fee_amount": 2500,
    "payouts": [
      {"recipient": "...", "payout": 1200000},
      {"recipient": "...", "payout": 800000}
    ]
  },
  "signature": "..."
}
```

### 5. Database (Optional)
**Location**: `/backend/src/db`

**Purpose**: Cache Solana data for faster queries

**Schema**:
- **Market**: Cache market metadata
- **Bet**: Index bets for quick lookup
- **ResolutionJob**: Track Arcium job status
- **User**: Store user preferences

## Data Flow

### Creating a Market

```
User (Frontend)
    │
    │ 1. Fill market form
    │
    ▼
Backend API
    │
    │ 2. Call Anchor program
    │
    ▼
Solana Program
    │
    │ 3. Create Market PDA
    │ 4. Initialize Escrow Vault
    │
    ▼
On-chain State Updated
```

### Placing a Bet

```
User (Frontend)
    │
    │ 1. Enter bet: choice + amount
    │
    ▼
Arcium SDK (Client)
    │
    │ 2. Encrypt bet data
    │
    ▼
Backend API
    │
    │ 3. Submit encrypted blob
    │
    ▼
Solana Program
    │
    │ 4. Transfer funds to escrow
    │ 5. Store encrypted bet
    │
    ▼
BetLog PDA Created
```

### Market Resolution

```
Deadline Passes
    │
    │ 1. Anyone calls resolve
    │
    ▼
Backend API
    │
    │ 2. Call enqueue_resolution
    │
    ▼
Solana Program
    │
    │ 3. Create ResolutionJob PDA
    │
    ▼
Backend API
    │
    │ 4. Fetch all encrypted bets
    │ 5. Trigger Arcium MXE job
    │
    ▼
Arcium MXE
    │
    │ 6. Decrypt bets (MPC)
    │ 7. Compute outcome
    │ 8. Calculate payouts
    │ 9. Sign result
    │
    ▼
Backend API (or Arcium callback)
    │
    │ 10. Submit result to Solana
    │
    ▼
Solana Program
    │
    │ 11. Verify signature
    │ 12. Distribute funds
    │
    ▼
Winners Paid Out ✅
```

## Privacy Guarantees

### What's Private (Encrypted)
✅ **Bet choice** (YES or NO)  
✅ **Bet amount** (stake size)  
✅ **Oracle inputs** (if used)

These are encrypted client-side and only decrypted inside Arcium MXE using MPC. No single party ever sees the plaintext.

### What's Public
❌ Market question  
❌ Market deadline  
❌ Total pool size  
❌ Number of bets  
❌ Final outcome  
❌ Individual payouts (but NOT original bets)

## Security Considerations

### 1. Encrypted Bets
- Bets are encrypted using Arcium's encryption scheme
- Only decryptable within the MXE under MPC
- No backend server or blockchain node can read them

### 2. Verifiable Computation
- MXE signs all results
- Solana program verifies signatures before accepting
- Prevents tampering with outcomes

### 3. Escrow Safety
- Funds locked in program-controlled PDA
- Only released after verified MXE result
- No admin can withdraw funds

### 4. No Front-Running
- Since bets are encrypted, no one can see positions before deadline
- Prevents manipulation and insider trading

## Scalability

### Current Limitations
- Solana account size limits bet blob storage (~10KB)
- MXE processing time for large markets (1000+ bets)

### Solutions
- **Bet blob compression**: gzip before encryption
- **Off-chain storage**: Store encrypted blobs on IPFS, only hash on-chain
- **Batch processing**: MXE can process bets in batches
- **L2 aggregation**: Pre-aggregate pools before MXE

## Future Enhancements

### Phase 2
- [ ] Multi-outcome markets (not just binary)
- [ ] Automated oracle integration (Pyth, Switchboard)
- [ ] Market liquidity pools (AMM-style)
- [ ] Mobile app

### Phase 3
- [ ] Cross-chain markets (via Wormhole)
- [ ] Governance token for protocol fees
- [ ] Market maker incentives
- [ ] Advanced analytics dashboard

## Testing Strategy

### Unit Tests
- Anchor program: `anchor test`
- MXE: `cargo test`
- Backend: `npm test`

### Integration Tests
1. End-to-end market creation → bet → resolution flow
2. Multiple users betting on same market
3. Edge cases: zero bets, deadline passing, tie outcomes

### Testnet Deployment
1. Deploy to Solana Devnet
2. Deploy MXE to Arcium Testnet
3. Run demo with test users

## Monitoring

### Logs
- Backend: Winston logger → files + console
- Solana: Transaction logs via RPC
- Arcium: Job status polling

### Metrics to Track
- Markets created per day
- Total volume locked
- Average resolution time
- MXE job success rate

---

## Quick Reference

### Key Addresses
```
Solana Program ID: <from anchor deploy>
MXE Program ID: <from arcium deploy>
Devnet RPC: https://api.devnet.solana.com
Arcium Endpoint: https://testnet.api.arcium.com
```

### PDAs
```
Market: ["market", creator_pubkey]
Escrow: ["escrow", market_pubkey]
BetLog: ["bet", market_pubkey, user_pubkey, bet_count]
ResolutionJob: ["rqueue", market_pubkey]
```

### Token Flow
```
User Wallet → Escrow → Winner Wallet
              (locked)  (after MXE)
```
