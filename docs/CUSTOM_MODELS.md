# 🎯 Custom Model Support

Corvus supports **full model flexibility** for all LLM providers! Use any model you want via CLI flags or config.

**🔓 No Restrictions:** Corvus doesn't limit which models you can use. The registry shows recommended models, but you can specify ANY model ID supported by your provider - including new releases, beta models, and custom fine-tunes.

---

## 🚀 Quick Start

### **View All Available Models**
```bash
corvus models                # List all providers and models
corvus models anthropic      # Filter by provider
corvus models openai
corvus models google
corvus models groq
corvus models ollama
```

### **Use Custom Model (CLI Flag)**
```bash
# OpenAI models
corvus chat --provider openai --model gpt-4o-mini
corvus chat --provider openai --model gpt-3.5-turbo

# Anthropic models
corvus chat --provider anthropic --model claude-3-5-haiku-20241022
corvus chat --provider anthropic --model claude-3-opus-20240229

# Google models
corvus chat --provider google --model gemini-1.5-pro
corvus chat --provider google --model gemini-2.0-flash-exp

# Groq models
corvus chat --provider groq --model llama-3.1-8b-instant
corvus chat --provider groq --model mixtral-8x7b-32768

# Ollama models (local)
corvus chat --local --model mistral
corvus chat --local --model codellama
corvus chat --local --model qwen2.5-coder
```

### **Save Custom Model in Config**
```bash
# Set default model for all chats
corvus config set llm.model gpt-4o-mini
corvus config set llm.provider openai

# Now just run chat (will use config defaults)
corvus chat
```

---

## 📋 Available Models by Provider

### **Anthropic** (Best for: reasoning, coding, analysis)
| Model | ID | Context | Cost ($/1M) | Notes |
|-------|----|---------|----|-------|
| Claude 3.5 Sonnet | `claude-3-5-sonnet-20241022` | 200k | $3/$15 | **Default** - Best overall |
| Claude 3.5 Haiku | `claude-3-5-haiku-20241022` | 200k | $0.8/$4 | Fast & affordable |
| Claude 3 Opus | `claude-3-opus-20240229` | 200k | $15/$75 | Most capable (expensive) |

### **OpenAI** (Best for: general purpose, coding)
| Model | ID | Context | Cost ($/1M) | Notes |
|-------|----|---------|----|-------|
| GPT-4o | `gpt-4o` | 128k | $2.5/$10 | **Default** - Latest & fastest |
| GPT-4o Mini | `gpt-4o-mini` | 128k | $0.15/$0.6 | Very affordable |
| GPT-4 Turbo | `gpt-4-turbo` | 128k | $10/$30 | Previous gen |
| GPT-3.5 Turbo | `gpt-3.5-turbo` | 16k | $0.5/$1.5 | Cheapest |

### **Google** (Best for: large context, multimodal)
| Model | ID | Context | Cost ($/1M) | Notes |
|-------|----|---------|----|-------|
| Gemini 1.5 Flash | `gemini-1.5-flash` | 1M | $0.075/$0.3 | **Default** - Fast & cheap |
| Gemini 1.5 Pro | `gemini-1.5-pro` | 2M | $1.25/$5 | Most capable, huge context |
| Gemini 2.0 Flash (Exp) | `gemini-2.0-flash-exp` | 1M | Free | Experimental, free tier |

### **Groq** (Best for: speed, low cost)
| Model | ID | Context | Cost ($/1M) | Notes |
|-------|----|---------|----|-------|
| Llama 3.3 70B | `llama-3.3-70b-versatile` | 128k | $0.05/$0.08 | **Default** - Best overall |
| Llama 3.1 70B | `llama-3.1-70b-versatile` | 128k | $0.05/$0.08 | Previous version |
| Llama 3.1 8B | `llama-3.1-8b-instant` | 128k | $0.05/$0.08 | Fast & cheap |
| Mixtral 8x7B | `mixtral-8x7b-32768` | 32k | $0.24/$0.24 | Good for complex tasks |

### **Ollama** (Best for: privacy, no cost, local)
| Model | ID | Context | Cost | Notes |
|-------|----|---------|----|-------|
| Llama 3.2 | `llama3.2` | 128k | Free | **Default** - Latest |
| Llama 3.1 | `llama3.1` | 128k | Free | Previous version |
| Mistral 7B | `mistral` | 32k | Free | Fast & efficient |
| Code Llama | `codellama` | 16k | Free | Specialized for code |
| Qwen 2.5 Coder | `qwen2.5-coder` | 32k | Free | Code-focused |

---

## 🎯 Model Selection Priority

When you run `corvus chat`, models are chosen in this order:

1. **CLI `--model` flag** (highest priority)
2. **Config `llm.model` setting**
3. **Provider default** (first model in `corvus models <provider>`)

### Example:
```bash
# Scenario 1: Use CLI flag (overrides everything)
corvus chat --model gpt-4o-mini
# Uses: gpt-4o-mini

# Scenario 2: Use config
corvus config set llm.model gpt-4o-mini
corvus chat
# Uses: gpt-4o-mini (from config)

# Scenario 3: Provider default
corvus chat --provider anthropic
# Uses: claude-3-5-sonnet-20241022 (default for Anthropic)
```

---

## 💡 Use Cases & Recommendations

### **1. Daily Price Checks (Minimize Cost)**
```bash
# Use cheapest model
corvus config set llm.provider openai
corvus config set llm.model gpt-4o-mini  # $0.15/$0.6 per 1M

# Or use free local model
corvus chat --local --model llama3.2
```

### **2. Complex DeFi Analysis (Best Quality)**
```bash
# Use most capable model
corvus chat --provider anthropic --model claude-3-opus-20240229

# Or use Gemini Pro for huge context
corvus chat --provider google --model gemini-1.5-pro
```

### **3. Fast Queries (Speed Priority)**
```bash
# Use Groq (fastest inference)
corvus chat --provider groq --model llama-3.1-8b-instant

# Or GPT-4o Mini (very fast, affordable)
corvus chat --provider openai --model gpt-4o-mini
```

### **4. Privacy-Focused (No Cloud)**
```bash
# Always use local Ollama
corvus config set llm.provider ollama
corvus config set llm.model llama3.2

# Or use --local flag
corvus chat --local
```

### **5. Code Generation (Specialized Models)**
```bash
# Use Ollama Code Llama
corvus chat --local --model codellama

# Or Qwen 2.5 Coder
corvus chat --local --model qwen2.5-coder
```

---

## 🔧 Advanced Configuration

### **Set Different Models Per Use Case**
```bash
# Default: cheap model for quick queries
corvus config set llm.provider openai
corvus config set llm.model gpt-4o-mini

# But for analysis, explicitly use better model
corvus chat --model gpt-4o  # Temporarily override

# For private queries, use local
corvus chat --local --model llama3.2
```

### **Test Multiple Models**
```bash
# Compare responses
corvus chat --provider openai --model gpt-4o
# Ask: "What's the SOL price?"

corvus chat --provider anthropic --model claude-3-5-sonnet-20241022
# Ask: "What's the SOL price?"

corvus chat --provider google --model gemini-1.5-flash
# Ask: "What's the SOL price?"
```

### **Check Current Config**
```bash
corvus config list
# Shows current provider and model
```

---

## 🆕 New Commands

### **`corvus models [provider]`**
List all available models with details

```bash
corvus models              # All providers
corvus models anthropic    # Just Anthropic
corvus models openai       # Just OpenAI
```

**Output:**
- Model name and ID
- Description (recommended, fast, etc.)
- Context window size
- Cost per 1M tokens
- Default indicator

---

## 📊 Model Comparison: Cost vs Quality

**Ranked by Cost (Cheapest to Most Expensive):**

1. **Ollama (Local)** - $0 - Free, private, requires local resources
2. **Google Gemini 1.5 Flash** - $0.075/$0.3 - Incredibly cheap, huge context
3. **Groq Llama 3.3 70B** - $0.05/$0.08 - Very cheap, fast inference
4. **OpenAI GPT-4o Mini** - $0.15/$0.6 - Cheap, good quality
5. **Anthropic Claude 3.5 Haiku** - $0.8/$4 - Affordable, fast
6. **OpenAI GPT-4o** - $2.5/$10 - Mid-price, excellent
7. **Anthropic Claude 3.5 Sonnet** - $3/$15 - Premium, best reasoning
8. **Google Gemini 1.5 Pro** - $1.25/$5 - Premium, 2M context
9. **Anthropic Claude 3 Opus** - $15/$75 - Most expensive, most capable

**Ranked by Quality (Best to Good):**

1. Claude 3 Opus (most capable)
2. Claude 3.5 Sonnet (best overall value)
3. GPT-4o (fast & capable)
4. Gemini 1.5 Pro (huge context)
5. Claude 3.5 Haiku (fast)
6. GPT-4o Mini (affordable)
7. Llama 3.3 70B (Groq/Ollama)
8. Gemini 1.5 Flash (cheap & fast)
9. GPT-3.5 Turbo (basic)

---

## ❓ FAQ

**Q: Can I use models not listed?**
A: **Yes! Absolutely.** Corvus does NOT restrict which models you can use. The `corvus models` command shows recommended models with verified pricing, but you have full flexibility:

```bash
# New models (released after this version)
corvus chat --provider openai --model gpt-5-turbo  # When released

# Beta/experimental models
corvus chat --provider google --model gemini-2.0-flash-exp

# Older models not in the list
corvus chat --provider anthropic --model claude-3-haiku-20240307

# Fine-tuned models
corvus chat --provider openai --model ft:gpt-3.5-turbo:my-org:custom_suffix

# Custom Ollama models
corvus chat --local --model my-custom-llama-fine-tune
```

**How it works:** Corvus passes your model ID directly to the provider's API. If the model doesn't exist, you'll get an error from the API itself. This means you can use:
- ✅ Newly released models immediately (no Corvus update needed)
- ✅ Beta/preview models
- ✅ Custom fine-tuned models
- ✅ Organization-specific models
- ✅ Any locally installed Ollama model

**Q: How do I know if a model exists?**
A: Run `corvus models <provider>` to see all available models, or check the provider's documentation.

**Q: Can I use different models for different conversations?**
A: Yes! Use `--model` flag for one-time override, or change config between conversations.

**Q: What happens if I specify an invalid model?**
A: The LLM client will error and suggest running `corvus models` to see available options.

**Q: Do Ollama models need to be downloaded first?**
A: Yes! Run `ollama pull <model>` before using:
```bash
ollama pull llama3.2
ollama pull mistral
ollama pull codellama
```

**Q: Which provider/model is best?**
A: Depends on your needs:
- **Best overall:** Claude 3.5 Sonnet or GPT-4o
- **Cheapest cloud:** Gemini 1.5 Flash or Groq Llama 3.3
- **Free & private:** Ollama Llama 3.2
- **Fastest:** Groq (any model) or GPT-4o Mini
- **Largest context:** Gemini 1.5 Pro (2M tokens)

---

## 🎊 Examples

### Example 1: Budget-Conscious User
```bash
# Set cheap default
corvus config set llm.provider google
corvus config set llm.model gemini-1.5-flash

# Daily usage (only $0.075/$0.3 per 1M tokens)
corvus chat
You: What's the SOL price?
Corvus: $78.26
```

### Example 2: Quality-Focused Researcher
```bash
# Use best model for deep analysis
corvus chat --provider anthropic --model claude-3-opus-20240229 --save research

You: Analyze top 10 DeFi protocols by TVL and compare risks
Corvus: [Detailed analysis]

You: /cost
💰 Cost: $0.15 (worth it for quality!)
```

### Example 3: Speed Tester
```bash
# Compare speed across providers
time corvus chat --provider groq --model llama-3.1-8b-instant
# ~1-2 seconds

time corvus chat --provider openai --model gpt-4o-mini
# ~2-3 seconds

time corvus chat --provider anthropic --model claude-3-5-haiku-20241022
# ~2-4 seconds
```

---

**Ready to customize?**
```bash
corvus models          # See all options
corvus chat --help     # See chat flags
corvus config --help   # See config commands
```

🚀 **Enjoy full control over your LLM experience!**
