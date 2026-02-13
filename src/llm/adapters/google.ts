/**
 * Google Gemini Adapter
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMClient, Message, Tool, LLMResponse, ToolCall, LLMProvider } from '../types.js';
import { toGoogleTools } from '../tool-converter.js';

export class GoogleAdapter implements ILLMClient {
  private client: GoogleGenerativeAI;
  private generativeModel: any;
  public provider: LLMProvider = 'google';
  public model: string;
  public supportsStreaming = true;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
    this.generativeModel = this.client.getGenerativeModel({ model });
  }

  async chat(messages: Message[], tools: Tool[]): Promise<LLMResponse> {
    try {
      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      // Start chat with history
      const chat = this.generativeModel.startChat({
        history,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
        tools: tools.length > 0 ? [{ functionDeclarations: toGoogleTools(tools) }] : undefined,
      });

      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;

      const toolCalls: ToolCall[] = [];
      let textContent = '';

      // Extract function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          toolCalls.push({
            id: fc.name, // Gemini doesn't provide IDs
            name: fc.name,
            arguments: fc.args as Record<string, any>,
          });
        }
      }

      // Extract text
      textContent = response.text() || '';

      return {
        content: textContent || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: toolCalls.length > 0 ? 'tool_use' : 'stop',
        usage: {
          inputTokens: 0, // Gemini doesn't provide detailed usage yet
          outputTokens: 0,
          totalTokens: 0,
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

    // Gemini 1.5 Flash pricing per 1M tokens (as of Feb 2024)
    const inputCost = 0.075; // $0.075 per 1M input tokens (128k context)
    const outputCost = 0.30; // $0.30 per 1M output tokens

    return ((tokens * inputCost) / 1_000_000) + ((tokens * outputCost) / 1_000_000);
  }
}
