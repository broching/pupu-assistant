// lib/encryption/helper.ts
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const IV_LENGTH = 16; // AES-GCM standard

// Ensure your env variable is a 64-char hex string (32 bytes)
if (!process.env.GMAIL_TOKENS_ENCRYPTION_KEY) {
  throw new Error("GMAIL_TOKENS_ENCRYPTION_KEY is not defined in environment variables");
}

const ENCRYPTION_KEY = Buffer.from(process.env.GMAIL_TOKENS_ENCRYPTION_KEY, "hex"); // 32 bytes

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("GMAIL_TOKENS_ENCRYPTION_KEY must be 32 bytes (64 hex chars) for aes-256-gcm");
}

/**
 * Encrypt a string using AES-256-GCM
 * @param text - plain text to encrypt
 * @returns IV:ciphertext:authTag (all hex)
 */
export function encrypt(text: string): string {
  if (!text) return ""; // handle empty string safely

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

/**
 * Decrypt a string encrypted by AES-256-GCM
 * @param encrypted - IV:ciphertext:authTag format
 * @returns decrypted plain text
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return ""; // handle empty string safely

  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected IV:ciphertext:authTag");
  }

  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString("utf8");
}


function isEncrypted(value: string) {
  return typeof value === "string" && value.split(":").length === 3;
}

export function safeDecrypt(value: string): string {
  if (!value) return "";
  if (!isEncrypted(value)) {
    // already plain text (legacy data)
    return value;
  }
  return decrypt(value);
}
