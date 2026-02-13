/**
 * OpenAI-Compatible Adapter
 *
 * Works with: OpenAI, Groq, Ollama, Together AI
 */

import OpenAI from 'openai';
import { ILLMClient, Message, Tool, LLMResponse, ToolCall, LLMProvider } from '../types.js';
import { toOpenAITools } from '../tool-converter.js';

const BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  ollama: 'http://localhost:11434/v1',
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o', // Latest: Feb 2024+ (faster, cheaper than gpt-4-turbo)
  groq: 'llama-3.3-70b-versatile', // Current as of Feb 2024
  ollama: 'qwen3-coder-next', // Optimized for agentic workflows & tool calling
};

export class OpenAIAdapter implements ILLMClient {
  private client: OpenAI;
  public provider: LLMProvider;
  public model: string;
  public supportsStreaming = true;

  constructor(provider: LLMProvider, apiKey: string, model?: string) {
    this.provider = provider;
    this.model = model || DEFAULT_MODELS[provider];

    this.client = new OpenAI({
      apiKey: provider === 'ollama' ? 'ollama' : apiKey, // Ollama doesn't need real key
      baseURL: BASE_URLS[provider],
    });
  }

  async chat(messages: Message[], tools: Tool[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools: toOpenAITools(tools),
        tool_choice: 'auto',
        temperature: 0.7,
      });

      const choice = response.choices[0];
      const toolCalls: ToolCall[] = [];

      // Extract tool calls if present
      if (choice.message.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          });
        }
      }

      return {
        content: choice.message.content || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: choice.finish_reason === 'tool_calls' ? 'tool_use' :
                      choice.finish_reason === 'stop' ? 'stop' : 'length',
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error: any) {
      return {
        content: `Error: ${error.message}`,
        finishReason: 'error',
      };
    }
  }

  async *streamChat(messages: Message[], tools: Tool[]): AsyncGenerator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools: toOpenAITools(tools),
        tool_choice: 'auto',
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }

        // Handle tool calls in streaming mode
        const toolCalls = chunk.choices[0]?.delta?.tool_calls;
        if (toolCalls) {
          // Note: Tool calls in streaming are more complex
          // For now, we'll handle them in non-streaming mode
          yield '\n[Using tools...]\n';
        }
      }
    } catch (error: any) {
      yield `Error: ${error.message}`;
    }
  }

  estimateCost(messages: Message[]): number {
    // Rough estimation (tokens ≈ words * 1.3)
    const words = messages.reduce((sum, m) => sum + m.content.split(' ').length, 0);
    const tokens = Math.ceil(words * 1.3);

    // Pricing per 1M tokens (as of Feb 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      openai: { input: 2.5, output: 10 }, // GPT-4o (much cheaper than GPT-4 Turbo)
      groq: { input: 0.05, output: 0.08 }, // Llama 3.3 70B (very cheap)
      ollama: { input: 0, output: 0 }, // Free (local)
    };

    const rates = pricing[this.provider] || { input: 0, output: 0 };
    return ((tokens * rates.input) / 1_000_000) + ((tokens * rates.output) / 1_000_000);
  }
}
