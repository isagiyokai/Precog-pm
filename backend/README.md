# Precog Backend

Node.js/Express backend API for the Precog prediction market.

## Setup

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your_anchor_program_id>
MXE_PROGRAM_ID=<your_mxe_program_id>
ARCIUM_API_KEY=<your_arcium_api_key>
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Database (Optional)

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:studio
```

## API Endpoints

- `GET /` - Health check
- `POST /api/markets/create` - Create market
- `POST /api/markets/:id/bet` - Place bet
- `POST /api/markets/:id/resolve` - Resolve market
- `GET /api/markets/:id` - Get market details
