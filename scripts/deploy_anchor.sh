#!/bin/bash

# Deploy Anchor Program Script
# This script builds and deploys the Solana program to devnet

set -e

echo "🔧 Building Anchor program..."
cd programs/market_factory
anchor build

echo "🧪 Running tests..."
anchor test --skip-local-validator

echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Program ID should be visible above."
echo "Update backend/.env with PROGRAM_ID"

cd ../..
