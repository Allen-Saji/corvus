import fetch from "node-fetch";
import { validateTelegramChatId } from "../lib/validation";

/**
 * Tool 8: Send Telegram alert
 *
 * Sends formatted messages to Telegram with markdown support
 * and severity-based emoji prefixes
 */
export async function sendTelegramAlertTool(
  chat_id: string,
  message: string,
  severity: "info" | "warning" | "critical" = "info"
): Promise<string> {
  // Validate chat ID
  const validation = validateTelegramChatId(chat_id);
  if (!validation.valid) {
    return JSON.stringify({
      error: validation.error,
      _meta: {
        tool: "send_telegram_alert",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Validate and sanitize message
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return JSON.stringify({
      error: "No message provided. Please provide a message to send.",
      _meta: {
        tool: "send_telegram_alert",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Check Telegram's 4096 character limit
  if (trimmedMessage.length > 4000) {
    return JSON.stringify({
      error: "Message exceeds Telegram's 4096 character limit. Please shorten your message.",
      _meta: {
        tool: "send_telegram_alert",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Get Telegram bot token
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return JSON.stringify({
      error:
        "TELEGRAM_BOT_TOKEN environment variable is not set. Please configure your Telegram bot token.",
      _meta: {
        tool: "send_telegram_alert",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Add severity emoji prefix
  const severityEmojis = {
    info: "ℹ️",
    warning: "⚠️",
    critical: "🚨",
  };

  const emoji = severityEmojis[severity];
  if (!emoji) {
    return JSON.stringify({
      error: `Invalid severity level: ${severity}`,
      _meta: {
        tool: "send_telegram_alert",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Escape special Markdown characters to prevent formatting issues
  const escapedMessage = trimmedMessage
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_");

  const formattedMessage = `${emoji} *${severity.toUpperCase()}*\n\n${escapedMessage}`;

  // Send to Telegram with timeout
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // Add timeout with AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id,
          text: formattedMessage,
          parse_mode: "Markdown",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMessage = "Unknown error";
        let errorCode;
        try {
          const errorData: any = await response.json();
          errorMessage = errorData.description || errorMessage;
          errorCode = errorData.error_code;
        } catch {
          errorMessage = `HTTP ${response.status} ${response.statusText}`;
        }

        return JSON.stringify({
          error: `Telegram API error: ${errorMessage}`,
          _meta: {
            tool: "send_telegram_alert",
            timestamp: new Date().toISOString(),
            telegram_error_code: errorCode,
          },
        });
      }

      const data: any = await response.json();

      // Validate response structure
      if (!data || !data.result) {
        return JSON.stringify({
          error: "Invalid response from Telegram API",
          _meta: {
            tool: "send_telegram_alert",
            timestamp: new Date().toISOString(),
          },
        });
      }

      return JSON.stringify(
        {
          success: true,
          message_id: data.result.message_id,
          chat_id: data.result.chat?.id,
          sent_at: data.result.date
            ? new Date(data.result.date * 1000).toISOString()
            : new Date().toISOString(),
          _meta: {
            tool: "send_telegram_alert",
            timestamp: new Date().toISOString(),
            severity: severity,
            data_source: "Telegram Bot API",
          },
        },
        null,
        2
      );
    } catch (fetchError: any) {
      clearTimeout(timeout);
      if (fetchError.name === "AbortError") {
        return JSON.stringify({
          error: "Telegram API request timed out after 5 seconds",
          _meta: {
            tool: "send_telegram_alert",
            timestamp: new Date().toISOString(),
          },
        });
      }
      throw fetchError;
    }
  } catch (err: any) {
    const errorMessage =
      err.code === "ECONNREFUSED"
        ? "Cannot connect to Telegram API"
        : "Failed to send Telegram message";

    return JSON.stringify({
      error: errorMessage,
      _meta: {
        tool: "send_telegram_alert",
        timestamp: new Date().toISOString(),
      },
    });
  }
}
