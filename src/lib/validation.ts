import { PublicKey } from "@solana/web3.js";
import { ValidationResult } from "../types";

/**
 * Validates a Solana wallet address using Solana SDK
 * This provides proper base58 decoding and checksum validation
 */
export function validateSolanaAddress(address: string): ValidationResult {
  if (!address || typeof address !== "string") {
    return { valid: false, error: "No wallet address provided." };
  }

  const trimmed = address.trim();

  // Use Solana SDK for proper validation
  try {
    new PublicKey(trimmed);
    return { valid: true };
  } catch (err: any) {
    // Sanitize error message - don't expose internal details
    return {
      valid: false,
      error: `Invalid Solana address format. Expected a base58-encoded public key.`,
    };
  }
}

/**
 * Validates a positive integer parameter
 */
export function validatePositiveInteger(
  value: any,
  name: string,
  max?: number
): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: true }; // Optional parameter
  }

  const num = parseInt(value);

  if (isNaN(num) || num <= 0) {
    return {
      valid: false,
      error: `${name} must be a positive integer.`,
    };
  }

  if (max && num > max) {
    return {
      valid: false,
      error: `${name} cannot exceed ${max}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a Telegram chat ID
 */
export function validateTelegramChatId(chatId: string): ValidationResult {
  if (!chatId || typeof chatId !== "string") {
    return { valid: false, error: "No Telegram chat ID provided." };
  }

  // Chat IDs can be numeric or start with @ for usernames
  const trimmed = chatId.trim();
  if (trimmed.startsWith("@") || /^-?\d+$/.test(trimmed)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `"${trimmed}" is not a valid Telegram chat ID. Use a numeric ID or @username.`,
  };
}
