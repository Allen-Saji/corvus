# 🧙 Setup Wizard - Feature Plan

## Overview

Add an interactive `corvus setup` command to help users configure Corvus for the first time.

---

## User Experience

```bash
$ corvus setup

🦅 Welcome to Corvus - Solana DeFi Intelligence CLI

Let's get you set up! This wizard will help you configure your API keys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Step 1: Helius API Key (Required)

Corvus needs a Helius API key to fetch Solana blockchain data.

   • Get free key: https://dashboard.helius.dev
   • Free tier: 100,000 requests/day

? Enter your Helius API key: _______________

✓ Helius API key saved!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Step 2: LLM Provider (Choose at least one)

Corvus needs an AI provider for natural language queries.

? Which provider would you like to use?
  ❯ Groq (Recommended - Fast & Cheap)
    Anthropic (Best Quality)
    OpenAI (Most Popular)
    Google Gemini (Cheapest)
    Ollama (Free & Local)
    ↓ I'll set this up later

[User selects Groq]

Great choice! Groq is fast and affordable.

   • Sign up: https://console.groq.com
   • Cost: Free tier, then ~$0.001/query

? Enter your Groq API key: _______________

✓ Groq API key saved!

? Would you like to add another provider? (Y/n) n

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Step 3: Default Settings

? Set Groq as your default provider? (Y/n) Y
✓ Default provider set to: groq

? Enable streaming (real-time responses)? (Y/n) Y
✓ Streaming enabled by default

? Max cost per session? ($0.50) 0.50
✓ Max cost set to: $0.50

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Setup Complete!

Your configuration has been saved to: ~/.corvus/config.json

🎯 Try these commands:

   corvus chat --stream          Start AI chat
   corvus price SOL              Check SOL price
   corvus models                 View available models
   corvus --help                 View all commands

Happy analyzing! 🚀
```

---

## Implementation

### **New Command: `corvus setup`**

```typescript
// src/cli.ts

program
  .command('setup')
  .description('Interactive setup wizard')
  .action(async () => {
    await runSetupWizard();
  });
```

### **Dependencies**

```json
{
  "inquirer": "^9.2.0",  // Interactive prompts
  "ora": "^7.0.0"         // Spinners for validation
}
```

### **Setup Flow**

1. **Welcome Screen**
   - Display banner
   - Explain what will happen

2. **Helius API Key** (Required)
   - Prompt for key
   - Validate with test API call
   - Save to .env or config

3. **LLM Provider Selection**
   - Show options with descriptions
   - Allow multiple selections
   - Prompt for API keys
   - Validate each key
   - Save to .env or config

4. **Default Settings**
   - Default provider
   - Streaming preference
   - Cost limits
   - Save to ~/.corvus/config.json

5. **Completion**
   - Show summary
   - Suggest next commands
   - Option to run test query

---

## File Structure

```
src/
├── setup/
│   ├── wizard.ts         # Main setup wizard
│   ├── validators.ts     # API key validators
│   └── prompts.ts        # Inquirer prompts
```

---

## API Key Validation

### **Test Helius**
```typescript
async function validateHeliusKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/balances?api-key=${key}`,
      { method: 'GET' }
    );
    return response.ok;
  } catch {
    return false;
  }
}
```

### **Test Groq**
```typescript
async function validateGroqKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

---

## Storage Options

### **Option 1: .env file** (Simple)
```typescript
// Append to .env
fs.appendFileSync('.env', `\nGROQ_API_KEY=${key}`);
```

### **Option 2: Config file** (Secure - NOT RECOMMENDED)
```typescript
// Store in ~/.corvus/keys.json (encrypted)
// BAD IDEA - keys should stay in .env
```

### **Option 3: Environment + Config** (Best)
```typescript
// 1. Create .env if missing
// 2. Add keys to .env
// 3. Add preferences to ~/.corvus/config.json
```

---

## Edge Cases

### **Existing .env**
```
? .env file already exists. What would you like to do?
  ❯ Update existing keys
    Add new keys only
    Skip (use existing .env)
```

### **No API Keys**
```
⚠️  No LLM provider configured!

You can:
  • Run setup again: corvus setup
  • Manually edit .env: nano .env
  • Use Ollama (local, free): corvus config set llm.provider ollama
```

### **Invalid Keys**
```
✗ Invalid API key! Please check and try again.

Common issues:
  • Key starts with wrong prefix (e.g., sk-ant- for Anthropic)
  • Key expired or revoked
  • No internet connection

? Try again? (Y/n)
```

---

## Future Enhancements

### **Phase 2: Advanced Setup**
- Custom config directory
- Multiple profiles (dev/prod)
- Team sharing (config templates)

### **Phase 3: Auto-Detection**
```bash
# Detect API keys from environment
corvus setup --detect
# Finds: ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.
```

### **Phase 4: Cloud Sync**
```bash
# Sync config across machines
corvus setup --sync
```

---

## Testing

```bash
# Test setup wizard
npm run setup-test

# Manual test
corvus setup
# Follow prompts, verify:
# - .env created/updated
# - Config saved to ~/.corvus/config.json
# - Keys work with test queries
```

---

## Documentation Updates

### **README.md**
Add quick start section:
```markdown
## Quick Start

### 1. Install
\`\`\`bash
npm install -g corvus-solana-cli
\`\`\`

### 2. Setup
\`\`\`bash
corvus setup
\`\`\`

### 3. Use!
\`\`\`bash
corvus chat --stream
\`\`\`
```

---

## Priority

**Phase 1 (MVP):**
- ✅ INSTALLATION.md (done)
- ⏳ Basic setup wizard
- ⏳ Helius + one LLM provider

**Phase 2 (Nice-to-have):**
- Multiple provider support
- Key validation
- Better error messages

**Phase 3 (Future):**
- Auto-detection
- Profiles
- Cloud sync

---

**Estimated effort:** 4-6 hours for Phase 1
