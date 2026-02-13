/**
 * LLM Factory
 *
 * Creates the appropriate LLM client based on configuration
 */

import { ILLMClient, LLMProvider, LLMConfig } from './types.js';
import { OpenAIAdapter } from './adapters/openai.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { GoogleAdapter } from './adapters/google.js';

/**
 * Get API key from environment
 */
function getApiKey(provider: LLMProvider): string | undefined {
  const envVars: Record<LLMProvider, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
    groq: 'GROQ_API_KEY',
    ollama: '', // No key needed
  };

  const envVar = envVars[provider];
  return envVar ? process.env[envVar] : undefined;
}

/**
 * Check which providers are available based on API keys
 */
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  if (getApiKey('anthropic')) providers.push('anthropic');
  if (getApiKey('openai')) providers.push('openai');
  if (getApiKey('google')) providers.push('google');
  if (getApiKey('groq')) providers.push('groq');
  providers.push('ollama'); // Always available if Ollama is running

  return providers;
}

/**
 * Auto-detect best available provider
 */
export function autoDetectProvider(): LLMProvider {
  const available = getAvailableProviders();

  // Preference order: Anthropic > OpenAI > Google > Groq > Ollama
  if (available.includes('anthropic')) return 'anthropic';
  if (available.includes('openai')) return 'openai';
  if (available.includes('google')) return 'google';
  if (available.includes('groq')) return 'groq';
  return 'ollama';
}

/**
 * Create LLM client
 */
export function createLLMClient(config?: Partial<LLMConfig>): ILLMClient {
  const provider = config?.provider || autoDetectProvider();
  const apiKey = config?.apiKey || getApiKey(provider);

  // Validate API key for non-local providers
  if (provider !== 'ollama' && !apiKey) {
    throw new Error(
      `No API key found for ${provider}. Set ${provider.toUpperCase()}_API_KEY in .env\n` +
      `Available providers: ${getAvailableProviders().join(', ')}`
    );
  }

  switch (provider) {
    case 'anthropic':
      return new AnthropicAdapter(apiKey!, config?.model);

    case 'google':
      return new GoogleAdapter(apiKey!, config?.model);

    case 'openai':
    case 'groq':
    case 'ollama':
      return new OpenAIAdapter(provider, apiKey || 'ollama', config?.model);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Validate provider configuration
 */
export function validateProvider(provider: LLMProvider): {
  valid: boolean;
  error?: string;
  suggestion?: string;
} {
  const apiKey = getApiKey(provider);

  if (provider === 'ollama') {
    // TODO: Check if Ollama is running
    return { valid: true };
  }

  if (!apiKey) {
    return {
      valid: false,
      error: `Missing API key for ${provider}`,
      suggestion: `Set ${provider.toUpperCase()}_API_KEY in your .env file`,
    };
  }

  return { valid: true };
}
