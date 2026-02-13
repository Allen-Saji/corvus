#!/bin/bash
# Interactive chat test

echo "Starting interactive chat test..."
echo ""
echo "Commands to try:"
echo "1. What's the current SOL price?"
echo "2. exit"
echo ""

# Run chat with groq provider
node dist/cli.js chat --provider groq --no-privacy-warning
