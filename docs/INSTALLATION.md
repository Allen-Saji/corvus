# 🚀 Corvus Installation Guide

Complete guide for installing and configuring Corvus on your system.

---

## 📦 Prerequisites

- **Node.js 18+** (check: `node --version`)
- **npm** or **yarn**
- **API Key** for at least one LLM provider (see below)

---

## 🔧 Installation Methods

### **Method 1: NPM Install (Recommended)**

```bash
# Install globally from npm
npm install -g corvus-solana-cli

# Verify installation
corvus --version
```

### **Method 2: Install from Source**

```bash
# Clone repository
git clone https://github.com/yourusername/corvus.git
cd corvus

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link

# Or run directly
node dist/cli.js --version
```

---

## 🔑 API Key Setup

Corvus needs at least **one API key** from the providers below. Choose based on your needs:

### **Option 1: Groq (Recommended for Beginners)** ⭐

**Why:** Free tier, fast, easy to get started

1. Go to: https://console.groq.com
2. Sign up (free)
3. Get API key from dashboard
4. Cost: **Free tier available**, then ~$0.001/query

```bash
export GROQ_API_KEY="gsk-..."
# Or add to .env file (see below)
```

---

### **Option 2: Anthropic (Best Quality)**

**Why:** Best AI responses, most reliable

1. Go to: https://console.anthropic.com
2. Sign up and add credits ($5 minimum)
3. Get API key
4. Cost: ~$0.01-0.05 per query

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

### **Option 3: OpenAI (Most Popular)**

**Why:** Industry standard, reliable

1. Go to: https://platform.openai.com/api-keys
2. Sign up and add credits
3. Create API key
4. Cost: ~$0.001-0.01 per query

```bash
export OPENAI_API_KEY="sk-proj-..."
```

---

### **Option 4: Google Gemini (Cheapest Cloud)**

**Why:** Very cheap, good performance

1. Go to: https://makersuite.google.com/app/apikey
2. Create API key
3. Cost: ~$0.0001-0.001 per query

```bash
export GOOGLE_API_KEY="..."
```

---

### **Option 5: Ollama (100% Free & Local)**

**Why:** Free, private, no API needed

1. Install Ollama: https://ollama.com/download
2. Pull a model: `ollama pull llama3.1`
3. Cost: **FREE** (runs on your computer)

```bash
# No API key needed!
```

---

## ⚙️ Configuration

### **Method 1: Environment Variables** (Recommended)

Create a `.env` file in your home directory or project root:

```bash
# Required: Helius API key for Solana data
HELIUS_API_KEY=your-helius-key-here

# Choose at least ONE LLM provider:
GROQ_API_KEY=gsk-...                    # Recommended
ANTHROPIC_API_KEY=sk-ant-...            # Best quality
OPENAI_API_KEY=sk-proj-...              # Most popular
GOOGLE_API_KEY=...                       # Cheapest

# Optional: Telegram alerts
TELEGRAM_BOT_TOKEN=...
```

**Get Helius API Key:**
1. Go to: https://dashboard.helius.dev
2. Sign up (free tier: 100k requests/day)
3. Copy your API key

---

### **Method 2: Interactive Setup** (Coming Soon)

```bash
corvus setup
# Walks you through API key configuration
```

---

## 🎯 First Run

### **1. Verify Installation**

```bash
corvus --version
# Should show: corvus version x.x.x
```

### **2. Check Available Providers**

```bash
corvus models
# Shows which providers you can use based on your API keys
```

### **3. Set Default Provider**

```bash
# Option A: Use Groq (fast, cheap)
corvus config set llm.provider groq

# Option B: Use Anthropic (best quality)
corvus config set llm.provider anthropic

# Option C: Use OpenAI (popular)
corvus config set llm.provider openai

# Option D: Use local Ollama (free, private)
corvus config set llm.provider ollama
```

### **4. Test It!**

```bash
# Start AI chat
corvus chat --stream

# Or check a wallet balance directly
corvus balance <wallet-address>

# Or get token prices
corvus price SOL,USDC
```

---

## 🔒 Security Best Practices

### **Protect Your API Keys**

```bash
# 1. Never commit .env to git
echo ".env" >> .gitignore

# 2. Use environment variables in production
export GROQ_API_KEY="..."

# 3. Use different keys for dev/prod
# Dev:  .env.development
# Prod: .env.production
```

### **Permissions**

Corvus creates config files with secure permissions:
- Config: `~/.corvus/config.json` (mode 0600)
- Sessions: `~/.corvus/sessions/` (mode 0600)

---

## 🆘 Troubleshooting

### **"No API key found for provider"**

**Solution:**
1. Check your `.env` file exists
2. Verify API key is set: `echo $GROQ_API_KEY`
3. Try setting it directly: `export GROQ_API_KEY="your-key"`

---

### **"HELIUS_API_KEY not found"**

**Solution:**
1. Get free key: https://dashboard.helius.dev
2. Add to `.env`: `HELIUS_API_KEY=your-key`
3. Or set environment variable: `export HELIUS_API_KEY="your-key"`

---

### **"Model not found" with Ollama**

**Solution:**
```bash
# Check installed models
ollama list

# Pull the model you want
ollama pull llama3.1

# Then use it
corvus chat --local --model llama3.1
```

---

### **"Command not found: corvus"**

**Solution A:** Using npm link
```bash
cd corvus
npm link
```

**Solution B:** Use full path
```bash
node /path/to/corvus/dist/cli.js chat
```

**Solution C:** Add alias
```bash
echo 'alias corvus="node /path/to/corvus/dist/cli.js"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📚 Next Steps

### **Learn the Basics**

```bash
# View all commands
corvus --help

# View available models
corvus models

# View current config
corvus config list

# Get in-chat help
corvus chat
You: /help
```

### **Read the Docs**

- [README.md](README.md) - Overview
- [CUSTOM_MODELS.md](CUSTOM_MODELS.md) - Model guide
- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - All features

---

## 🎉 You're Ready!

Try these commands:

```bash
# AI chat
corvus chat --stream

# Check SOL price
corvus price SOL

# Analyze a wallet
corvus analyze <wallet-address>

# View top protocols
corvus top 10
```

---

## 💡 Recommended Setup for Different Users

### **For Developers (Testing/Local)**
```bash
# Use Ollama (free, private)
ollama pull llama3.1
corvus config set llm.provider ollama
```

### **For Production Use (Reliable)**
```bash
# Use Groq (fast, cheap, reliable)
export GROQ_API_KEY="..."
corvus config set llm.provider groq
```

### **For Best Quality (Money No Object)**
```bash
# Use Anthropic Claude
export ANTHROPIC_API_KEY="..."
corvus config set llm.provider anthropic
```

---

**Need help?**
- GitHub Issues: https://github.com/yourusername/corvus/issues
- Discord: [Your Discord Link]
- Twitter: @yourhandle
