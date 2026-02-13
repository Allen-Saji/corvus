/**
 * LLM Abstraction Types
 *
 * Common types for all LLM providers
 */

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LLMResponse {
  content?: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_use' | 'length' | 'error';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface ChatSession {
  messages: Message[];
  turnCount: number;
  totalCost: number;
  startTime: Date;
}

/**
 * Abstract LLM Client Interface
 */
export interface ILLMClient {
  chat(messages: Message[], tools: Tool[]): Promise<LLMResponse>;
  streamChat?(messages: Message[], tools: Tool[]): AsyncGenerator<string>;
  estimateCost(messages: Message[]): number;
  supportsStreaming: boolean;
  provider: LLMProvider;
  model: string;
}
