/**
 * Anthropic (Claude) Adapter
 */

import Anthropic from '@anthropic-ai/sdk';
import { ILLMClient, Message, Tool, LLMResponse, ToolCall, LLMProvider } from '../types.js';
import { toAnthropicTools } from '../tool-converter.js';

export class AnthropicAdapter implements ILLMClient {
  private client: Anthropic;
  public provider: LLMProvider = 'anthropic';
  public model: string;
  public supportsStreaming = true;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<LLMResponse> {
    try {
      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system');
      const userMessages = messages.filter((m) => m.role !== 'system');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        tools: toAnthropicTools(tools) as any, // Type assertion for SDK compatibility
        temperature: 0.7,
      });

      const toolCalls: ToolCall[] = [];
      let textContent = '';

      // Extract content blocks
      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          const toolBlock = block as any; // Type assertion for tool_use block
          toolCalls.push({
            id: toolBlock.id,
            name: toolBlock.name,
            arguments: toolBlock.input as Record<string, any>,
          });
        }
      }

      return {
        content: textContent || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: (response.stop_reason as string) === 'tool_use' ? 'tool_use' :
                      response.stop_reason === 'end_turn' ? 'stop' : 'length',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error: any) {
      return {
        content: `Error: ${error.message}`,
        finishReason: 'error',
      };
    }
  }

  estimateCost(messages: Message[]): number {
    // Rough estimation (tokens ≈ words * 1.3)
    const words = messages.reduce((sum, m) => sum + m.content.split(' ').length, 0);
    const tokens = Math.ceil(words * 1.3);

    // Claude Sonnet pricing per 1M tokens
    const inputCost = 3; // $3 per 1M input tokens
    const outputCost = 15; // $15 per 1M output tokens

    return ((tokens * inputCost) / 1_000_000) + ((tokens * outputCost) / 1_000_000);
  }
}
