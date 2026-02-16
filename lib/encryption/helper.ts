// lib/encryption/helper.ts
import crypto from "crypto";

/**
 * ============================================
 * Production AES-256-GCM Encryption (Single Key)
 * ============================================
 *
 * Format:
 * iv:ciphertext:authTag
 *
 * - AES-256-GCM
 * - 32-byte hex key from env
 * - Tamper detection
 * - Strict validation
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

// -------------------------------
// Load & Validate Key
// -------------------------------

function loadKey(): Buffer {
  const hex = process.env.GMAIL_TOKENS_ENCRYPTION_KEY;

  if (!hex) {
    throw new Error("GMAIL_TOKENS_ENCRYPTION_KEY is not defined");
  }

  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("Encryption key must be 64 hex characters (32 bytes)");
  }

  return Buffer.from(hex, "hex");
}

const KEY = loadKey();

// -------------------------------
// Helpers
// -------------------------------

function isValidHex(str: string) {
  return /^[0-9a-f]+$/i.test(str);
}

function parseEncrypted(value: string) {
  const parts = value.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const [ivHex, cipherHex, tagHex] = parts;

  if (!isValidHex(ivHex) || !isValidHex(cipherHex) || !isValidHex(tagHex)) {
    throw new Error("Encrypted payload contains invalid hex");
  }

  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid auth tag length");
  }

  return { iv, ciphertext, authTag };
}

function isEncrypted(value: string): boolean {
  if (typeof value !== "string") return false;
  return value.split(":").length === 3;
}

// -------------------------------
// Encrypt
// -------------------------------

export function encrypt(plainText: string): string {
  if (typeof plainText !== "string" || plainText.length === 0) {
    throw new Error("Cannot encrypt empty or invalid value");
  }

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    encrypted.toString("hex"),
    authTag.toString("hex"),
  ].join(":");
}

// -------------------------------
// Decrypt
// -------------------------------

export function decrypt(encrypted: string): string {
  if (typeof encrypted !== "string" || encrypted.length === 0) {
    throw new Error("Invalid encrypted value");
  }

  const { iv, ciphertext, authTag } = parseEncrypted(encrypted);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw new Error("Decryption failed (possible tampering)");
  }
}

// -------------------------------
// Safe Decrypt (Optional)
// -------------------------------

export function safeDecrypt(value: string): string {
  if (!value) return "";

  try {
    if (!isEncrypted(value)) {
      // Assume legacy plaintext
      return value;
    }

    return decrypt(value);
  } catch {
    // If decrypt fails, assume legacy plaintext
    return value;
  }
}
