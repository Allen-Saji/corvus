#!/bin/bash

# Corvus CLI - Basic Usage Examples
# Make sure you have HELIUS_API_KEY set in your .env file

echo "=== Corvus CLI Examples ==="
echo ""

# 1. Check token prices
echo "1. Get current SOL and USDC prices:"
corvus price SOL,USDC
echo ""

# 2. Check wallet balance
echo "2. Check a wallet's SOL balance:"
WALLET="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
corvus balance $WALLET
echo ""

# 3. View top protocols
echo "3. Top 5 Solana DeFi protocols:"
corvus top 5
echo ""

# 4. Get protocol details
echo "4. Jito protocol details:"
corvus protocol jito
echo ""

# 5. Analyze wallet DeFi positions
echo "5. Analyze wallet for DeFi positions:"
corvus analyze $WALLET
echo ""

echo "=== Try these yourself ==="
echo ""
echo "corvus --help           # See all commands"
echo "corvus models           # List available LLM models"
echo "corvus chat --stream    # Start AI chat with streaming"
echo "corvus config list      # View current configuration"
