/**
 * Available Models for Each Provider
 *
 * Reference guide for users to choose custom models
 */

import { LLMProvider } from './types.js';

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  costPer1M?: { input: number; output: number };
}

export const AVAILABLE_MODELS: Record<LLMProvider, ModelInfo[]> = {
  anthropic: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Best overall (recommended)',
      contextWindow: 200000,
      costPer1M: { input: 3.0, output: 15.0 },
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Fast and affordable',
      contextWindow: 200000,
      costPer1M: { input: 0.8, output: 4.0 },
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Most capable (expensive)',
      contextWindow: 200000,
      costPer1M: { input: 15.0, output: 75.0 },
    },
  ],

  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Latest and fastest (recommended)',
      contextWindow: 128000,
      costPer1M: { input: 2.5, output: 10.0 },
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Affordable and fast',
      contextWindow: 128000,
      costPer1M: { input: 0.15, output: 0.6 },
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Previous generation',
      contextWindow: 128000,
      costPer1M: { input: 10.0, output: 30.0 },
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fastest and cheapest',
      contextWindow: 16385,
      costPer1M: { input: 0.5, output: 1.5 },
    },
  ],

  google: [
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast and affordable (recommended)',
      contextWindow: 1000000,
      costPer1M: { input: 0.075, output: 0.30 },
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Most capable',
      contextWindow: 2000000,
      costPer1M: { input: 1.25, output: 5.0 },
    },
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      description: 'Next generation (free tier)',
      contextWindow: 1000000,
    },
  ],

  groq: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B',
      description: 'Best overall (recommended)',
      contextWindow: 128000,
      costPer1M: { input: 0.05, output: 0.08 },
    },
    {
      id: 'llama-3.1-70b-versatile',
      name: 'Llama 3.1 70B',
      description: 'Previous generation',
      contextWindow: 128000,
      costPer1M: { input: 0.05, output: 0.08 },
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B',
      description: 'Fast and cheap',
      contextWindow: 128000,
      costPer1M: { input: 0.05, output: 0.08 },
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      description: 'Good for complex tasks',
      contextWindow: 32768,
      costPer1M: { input: 0.24, output: 0.24 },
    },
  ],

  ollama: [
    {
      id: 'qwen3-coder-next',
      name: 'Qwen3 Coder Next',
      description: 'Optimized for agentic workflows & tools (recommended)',
      contextWindow: 128000,
      costPer1M: { input: 0, output: 0 },
    },
    {
      id: 'devstral-small-2',
      name: 'Devstral Small 2 (24B)',
      description: 'Excels at using tools, great for Corvus',
      contextWindow: 128000,
      costPer1M: { input: 0, output: 0 },
    },
    {
      id: 'qwen3-next',
      name: 'Qwen3 Next (80B)',
      description: 'Strong performance, parameter efficient',
      contextWindow: 128000,
      costPer1M: { input: 0, output: 0 },
    },
    {
      id: 'ministral-3',
      name: 'Ministral 3 (8B)',
      description: 'Lightweight, edge deployment',
      contextWindow: 128000,
      costPer1M: { input: 0, output: 0 },
    },
    {
      id: 'llama3.2',
      name: 'Llama 3.2 (3B)',
      description: 'Small model (poor at tool calling)',
      contextWindow: 128000,
      costPer1M: { input: 0, output: 0 },
    },
    {
      id: 'llama3.1',
      name: 'Llama 3.1 (8B)',
      description: 'Older but decent',
      contextWindow: 128000,
      costPer1M: { input: 0, output: 0 },
    },
  ],
};

/**
 * Get default model for provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  return AVAILABLE_MODELS[provider][0].id;
}

/**
 * Validate if model exists for provider
 */
export function isValidModel(provider: LLMProvider, modelId: string): boolean {
  return AVAILABLE_MODELS[provider].some(m => m.id === modelId);
}

/**
 * Get model info
 */
export function getModelInfo(provider: LLMProvider, modelId: string): ModelInfo | undefined {
  return AVAILABLE_MODELS[provider].find(m => m.id === modelId);
}
