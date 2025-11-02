#!/bin/bash

# Deploy Arcium MXE Script
# This script builds and deploys the MXE to Arcium testnet

set -e

echo "🔧 Building MXE..."
cd mxe
cargo build --release --target wasm32-unknown-unknown

echo "📦 Optimizing WASM..."
# Optional: use wasm-opt to optimize
# wasm-opt -Oz -o target/wasm32-unknown-unknown/release/resolve_market_mxe_opt.wasm \
#   target/wasm32-unknown-unknown/release/resolve_market_mxe.wasm

echo "🚀 Deploying to Arcium testnet..."
# TODO: Replace with actual Arcium CLI deployment command
# arcium deploy target/wasm32-unknown-unknown/release/resolve_market_mxe.wasm \
#   --network testnet \
#   --name "resolve-market-mxe"

# For now, placeholder command
echo "⚠️  TODO: Use Arcium CLI to deploy"
echo "   MXE binary: target/wasm32-unknown-unknown/release/resolve_market_mxe.wasm"
echo ""
echo "After deployment, update .env with MXE_PROGRAM_ID"

cd ..
