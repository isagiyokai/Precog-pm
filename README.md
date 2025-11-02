# Precog - Permissionless Private Prediction Market

A decentralized prediction market built on Solana with privacy-preserving computation powered by Arcium's Multi-Party Execution (MXE) environment.

## 🎯 Overview

Precog enables users to create and participate in prediction markets where **bet amounts and choices remain completely private** until settlement. This is achieved through:

- **Solana** for fast, low-cost transactions and escrow
- **Arcium MXE** for encrypted computation (MPC) over private bets
- **Next.js** frontend with Solana wallet integration

### Key Features

- 🔐 **Fully Private Bets**: No one sees individual bet amounts or choices
- ⚡ **Fast Settlement**: Arcium MXE computes outcomes in seconds
- 🔓 **Permissionless**: Anyone can create markets
- ✅ **Verifiable**: All computation is cryptographically proven
- 💸 **Low Fees**: Built on Solana for minimal transaction costs

## 📁 Project Structure

```
precog-pm/
├── programs/market_factory/    # Solana Anchor program
├── mxe/                        # Arcium MXE encrypted compute logic
├── backend/                    # Node.js/Express API
├── frontend/                   # Next.js UI (you've already built this)
├── scripts/                    # Deployment and utility scripts
└── docker-compose.yml         # Docker setup
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust & Cargo
- Solana CLI
- Anchor CLI
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/isagiyokai/Precog-pm.git
cd Precog-pm

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Setup

1. **Backend**: Copy `backend/.env` and fill in:
   - `PROGRAM_ID` (after deploying Anchor program)
   - `MXE_PROGRAM_ID` (after deploying MXE)
   - `ARCIUM_API_KEY` (from Arcium testnet)
   - `WALLET_KEYPAIR_PATH`

2. **Database** (optional):
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   ```

### Deployment

#### 1. Deploy Solana Program

```bash
cd programs/market_factory
anchor build
anchor deploy --provider.cluster devnet
```

Copy the program ID and update `backend/.env`.

#### 2. Deploy Arcium MXE

```bash
./scripts/deploy_mxe.sh
```

Follow Arcium documentation to complete deployment and update `backend/.env` with `MXE_PROGRAM_ID`.

#### 3. Run Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`.

#### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`.

## 🏗️ Architecture

### Flow

1. **User creates market** → Solana Anchor program creates market PDA
2. **User places bet** → Frontend encrypts bet → Anchor program stores encrypted blob
3. **Market deadline passes** → Anyone triggers resolution
4. **Arcium MXE** → Decrypts bets under MPC, computes outcome, returns signed result
5. **Solana program** → Verifies MXE signature, distributes payouts

### Components

#### Solana Program (Anchor)

- `create_market`: Initialize market with question and deadline
- `deposit_bet`: Store encrypted bet and lock funds in escrow
- `enqueue_resolution`: Create Arcium job for resolution
- `callback_settle`: Verify MXE result and distribute winnings

#### Arcium MXE

- `resolve_market`: 
  - Decrypt all bets within MPC
  - Aggregate pools (YES vs NO)
  - Compute proportional payouts
  - Sign and return verifiable result

#### Backend API

- `/api/markets/create`: Create new market
- `/api/markets/:id/bet`: Place encrypted bet
- `/api/markets/:id/resolve`: Trigger resolution
- `/api/markets/:id`: Get market details

## 🔒 Privacy Model

### What's Private

- ✅ Individual bet amounts
- ✅ Individual bet choices (YES/NO)
- ✅ Oracle inputs (if used)

### What's Public

- ✅ Market question and deadline
- ✅ Total pool size
- ✅ Final outcome (after resolution)
- ✅ Individual payouts (but not original bets)

All private data is encrypted client-side and only decrypted inside Arcium's MXE using MPC.

## 🧪 Testing

### Backend

```bash
cd backend
npm test
```

### Anchor Program

```bash
cd programs/market_factory
anchor test
```

### MXE

```bash
cd mxe
cargo test
```

## 📚 API Documentation

### Create Market

```bash
POST /api/markets/create
{
  "question": "Will Bitcoin reach $100k by EOY?",
  "deadline": 1735689600,
  "creatorPubkey": "..."
}
```

### Place Bet

```bash
POST /api/markets/:marketId/bet
{
  "choice": 1,
  "stake": 1000000,
  "userPubkey": "..."
}
```

### Resolve Market

```bash
POST /api/markets/:marketId/resolve
```

## 🛠️ Development

### Run with Docker

```bash
docker-compose up
```

### Hot Reload

Both frontend and backend support hot reload in development mode.

## 🤝 Contributing

Contributions welcome! Please open issues and PRs.

## 📄 License

MIT

## 🔗 Links

- [Arcium Docs](https://docs.arcium.com)
- [Solana Docs](https://docs.solana.com)
- [Anchor Framework](https://www.anchor-lang.com)

## 🏆 Built For

Cypherpunk Arcium Colloseum Hackathon - Private, Permissionless Prediction Markets

---

**Note**: This is a hackathon prototype. Do not use in production without proper audits and security reviews.
