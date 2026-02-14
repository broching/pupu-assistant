// lib/encryption/helper.ts
import crypto from "crypto";

/**
 * ============================================
 * Production Hardened AES-256-GCM Encryption
 * ============================================
 *
 * Format:
 * v1:iv:ciphertext:authTag
 *
 * Supports:
 * - Key rotation
 * - Multiple key versions
 * - Safe format validation
 * - Optional scrypt key derivation
 */

// -------------------------------
// Configuration
// -------------------------------

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit recommended for GCM
const CURRENT_KEY_VERSION = "v1";

// You can either:
// 1. Provide single key: GMAIL_TOKENS_ENCRYPTION_KEY
// OR
// 2. Provide JSON map: GMAIL_TOKENS_ENCRYPTION_KEYS='{"v1":"hexkey","v2":"hexkey"}'

function loadKeys(): Record<string, Buffer> {
  if (process.env.GMAIL_TOKENS_ENCRYPTION_KEYS) {
    const parsed = JSON.parse(process.env.GMAIL_TOKENS_ENCRYPTION_KEYS);
    const keys: Record<string, Buffer> = {};

    for (const version of Object.keys(parsed)) {
      const hex = parsed[version];
      const buf = Buffer.from(hex, "hex");

      if (buf.length !== 32) {
        throw new Error(`Key ${version} must be 32 bytes (64 hex chars)`);
      }

      keys[version] = buf;
    }

    return keys;
  }

  if (!process.env.GMAIL_TOKENS_ENCRYPTION_KEY) {
    throw new Error(
      "GMAIL_TOKENS_ENCRYPTION_KEY or GMAIL_TOKENS_ENCRYPTION_KEYS must be defined"
    );
  }

  const key = Buffer.from(process.env.GMAIL_TOKENS_ENCRYPTION_KEY, "hex");

  if (key.length !== 32) {
    throw new Error("GMAIL_TOKENS_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }

  return {
    [CURRENT_KEY_VERSION]: key,
  };
}

const KEYS = loadKeys();

// -------------------------------
// Utilities
// -------------------------------

function isValidHex(str: string) {
  return /^[0-9a-f]+$/i.test(str);
}

function parseEncrypted(value: string) {
  const parts = value.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted format. Expected vX:iv:ciphertext:authTag");
  }

  const [version, ivHex, cipherHex, tagHex] = parts;

  if (!KEYS[version]) {
    throw new Error(`Unknown encryption key version: ${version}`);
  }

  if (!isValidHex(ivHex) || !isValidHex(cipherHex) || !isValidHex(tagHex)) {
    throw new Error("Encrypted payload contains invalid hex");
  }

  return {
    version,
    iv: Buffer.from(ivHex, "hex"),
    ciphertext: Buffer.from(cipherHex, "hex"),
    authTag: Buffer.from(tagHex, "hex"),
  };
}

function isEncrypted(value: string): boolean {
  if (typeof value !== "string") return false;
  const parts = value.split(":");
  if (parts.length !== 4) return false;
  if (!parts[0].startsWith("v")) return false;
  return true;
}

// -------------------------------
// Encrypt
// -------------------------------

export function encrypt(plainText: string): string {
  if (!plainText) return "";

  const key = KEYS[CURRENT_KEY_VERSION];
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    CURRENT_KEY_VERSION,
    iv.toString("hex"),
    encrypted.toString("hex"),
    authTag.toString("hex"),
  ].join(":");
}

// -------------------------------
// Decrypt
// -------------------------------

export function decrypt(encrypted: string): string {
  if (!encrypted) return "";

  const { version, iv, ciphertext, authTag } = parseEncrypted(encrypted);
  const key = KEYS[version];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// -------------------------------
// Safe Decrypt (Legacy Compatible)
// -------------------------------

export function safeDecrypt(value: string): string {
  if (!value) return "";

  if (!isEncrypted(value)) {
    // legacy plaintext data
    return value;
  }

  return decrypt(value);
}

// -------------------------------
// Optional: Derive Key From Secret
// -------------------------------

/**
 * If you want to derive key instead of storing raw hex:
 *
 * const derived = crypto.scryptSync(secret, salt, 32);
 */
export function deriveKeyFromSecret(secret: string, salt: string): Buffer {
  return crypto.scryptSync(secret, salt, 32);
}
