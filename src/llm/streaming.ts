/**
 * Streaming Support
 *
 * Handles real-time streaming responses from LLMs
 */

import { ILLMClient, Message, Tool } from './types.js';

export class StreamHandler {
  constructor(private client: ILLMClient) {}

  async *stream(messages: Message[], tools: Tool[]): AsyncGenerator<string> {
    // Check if client supports streaming
    if (!this.client.supportsStreaming || !this.client.streamChat) {
      // Fall back to non-streaming
      const response = await this.client.chat(messages, tools);
      yield response.content || '';
      return;
    }

    // Stream from client
    for await (const chunk of this.client.streamChat(messages, tools)) {
      yield chunk;
    }
  }
}

/**
 * Utility to collect stream into full text
 */
export async function collectStream(stream: AsyncGenerator<string>): Promise<string> {
  let fullText = '';
  for await (const chunk of stream) {
    fullText += chunk;
  }
  return fullText;
}

/**
 * Utility to display stream in real-time
 */
export async function displayStream(
  stream: AsyncGenerator<string>,
  onChunk?: (chunk: string) => void
): Promise<string> {
  let fullText = '';

  for await (const chunk of stream) {
    fullText += chunk;
    if (onChunk) {
      onChunk(chunk);
    } else {
      process.stdout.write(chunk);
    }
  }

  return fullText;
}
