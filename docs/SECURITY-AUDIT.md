# Corvus Security & Code Quality Audit

> Conducted: 2026-02-12
> Status: **4 CRITICAL ISSUES FOUND - NOT PRODUCTION READY**

---

## 🚨 CRITICAL Issues (Fix Before Production)

### 1. API Key in URL Query Parameters ⚠️ HIGH RISK
**Files:** `src/lib/helius.ts` lines 13, 168
**Issue:** API keys passed in URLs are logged, cached, and exposed in error traces

**Current:**
```typescript
const url = `https://mainnet.helius-rpc.com/?api-key=${getHeliusApiKey()}`;
```

**Fix:**
```typescript
// Use Authorization header instead
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${getHeliusApiKey()}` }
});
```

**Risk:** API key theft, unauthorized access, billing fraud
**OWASP:** A01:2021 - Broken Access Control

---

### 2. API Key Configuration Logged ⚠️ MEDIUM RISK
**File:** `src/index.ts` line 240
**Issue:** Binary oracle reveals environment configuration

**Current:**
```typescript
console.error(`Environment: HELIUS_API_KEY=${process.env.HELIUS_API_KEY ? "✓ set" : "✗ missing"}`);
```

**Fix:** Remove entirely or move to debug-only mode

---

### 3. Unvalidated URL Parameters ⚠️ HIGH RISK
**File:** `src/lib/helius.ts` line 168
**Issue:** Wallet address concatenated directly into URL without encoding

**Current:**
```typescript
const url = `${getHeliusApiUrl()}/addresses/${wallet}/transactions?api-key=${key}&limit=${limit}`;
```

**Fix:**
```typescript
const url = new URL(`${getHeliusApiUrl()}/addresses/${encodeURIComponent(wallet)}/transactions`);
url.searchParams.append('limit', limit.toString());
```

**Risk:** URL injection, log poisoning, path traversal
**OWASP:** A03:2021 - Injection

---

### 4. Sensitive Info in Error Messages ⚠️ MEDIUM RISK
**File:** `src/index.ts` lines 213-228
**Issue:** Raw error messages may contain stack traces, file paths, internal details

**Fix:**
```typescript
const sanitizedMessage = error.code === 'ECONNREFUSED'
  ? 'External service unavailable'
  : 'An unexpected error occurred';

return {
  content: [{
    type: "text",
    text: JSON.stringify({
      error: sanitizedMessage,
      _meta: { tool: name, timestamp: new Date().toISOString() }
    })
  }],
  isError: true
};
```

**Risk:** Information disclosure, attack surface mapping
**OWASP:** A05:2021 - Security Misconfiguration

---

## ⚡ HIGH Priority (Fix Soon)

### 5. AbortController Not Connected
**File:** `src/lib/helius.ts` lines 29-30
**Issue:** Timeout created but never passed to fetch - requests don't actually abort

**Fix:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

const response = await fetch(url, {
  signal: controller.signal  // ← ADD THIS
});
```

---

### 6. No Rate Limiting
**Issue:** No protection against API quota exhaustion or DoS attacks

**Fix:** Add rate limiter
```typescript
import { RateLimiter } from 'limiter';
const heliusLimiter = new RateLimiter({ tokensPerInterval: 50, interval: 'second' });

// Before each API call:
await heliusLimiter.removeTokens(1);
```

---

### 7. Excessive `any` Usage (16 instances)
**Issue:** Bypasses TypeScript type safety, hiding runtime errors

**Fix:** Define proper interfaces for all API responses
```typescript
// Instead of:
const data: any = await response.json();

// Do:
interface HeliusBalanceResponse {
  result: { value: number };
  error?: { message: string };
}
const data = await response.json() as HeliusBalanceResponse;
```

---

### 8. Unbounded Token Fetching
**File:** `src/lib/helius.ts` line 109
**Issue:** Hardcoded limit of 1000 tokens - memory exhaustion risk

**Fix:**
```typescript
const MAX_TOKENS = 100;
limit: Math.min(userLimit || MAX_TOKENS, MAX_TOKENS)
```

---

### 9. Weak Wallet Validation
**File:** `src/lib/validation.ts` lines 6-30
**Issue:** Only checks length and base58 regex, no actual Solana validation

**Fix:**
```typescript
import { PublicKey } from '@solana/web3.js';

export function validateSolanaAddress(address: string): ValidationResult {
  try {
    new PublicKey(address);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: 'Invalid Solana address format'
    };
  }
}
```

---

### 10. Missing Input Length Limits
**File:** `src/tools/price.ts` lines 18-22
**Issue:** No limit on comma-separated token list

**Fix:**
```typescript
const MAX_TOKENS = 50;
if (tokenList.length > MAX_TOKENS) {
  return JSON.stringify({
    error: `Maximum ${MAX_TOKENS} tokens allowed per request`
  });
}
```

---

## 📊 Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| **Critical** | 4 | 🔴 Must fix |
| **High** | 6 | 🟠 Should fix |
| **Medium** | 9 | 🟡 Nice to fix |
| **Low** | 11 | ⚪ Optional |

**Production Readiness:** ❌ NOT READY

**Estimated Fix Time:** 3-5 developer hours for Critical + High priority

---

## 🎯 Quick Fix Checklist

- [ ] Move API key from URL to Authorization header
- [ ] Remove API key status logging
- [ ] Add URL encoding for user inputs
- [ ] Sanitize error messages
- [ ] Connect AbortController to fetch calls
- [ ] Replace all `any` types with proper interfaces
- [ ] Add rate limiting (10-50 req/min)
- [ ] Add input length limits (50 tokens max)
- [ ] Use Solana SDK for address validation
- [ ] Add max token fetch limit (100)

---

## 📚 Full Audit Reports

See separate files:
- Security details: Review the full security agent output
- Code structure: Review the full structure agent output
