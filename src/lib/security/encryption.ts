/**
 * CONVERSA SECURE TOKEN ENCRYPTION SERVICE
 * Provides authenticated symmetric encryption (AES-256-GCM) for sensitive credentials
 * such as Meta Facebook Page Access Tokens and webhook secrets.
 *
 * Security properties:
 * - Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data)
 * - Unique 12-byte cryptographically random IV per encryption operation
 * - 16-byte authentication tag ensuring ciphertext integrity and tamper-resistance
 * - Keys are strictly sourced from server-side environment variables
 * - Plaintext secrets are never logged or exposed in error messages
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Derives a consistent 32-byte (256-bit) encryption key from the environment secret
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.META_TOKEN_ENCRYPTION_KEY ||
    process.env.TOKEN_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error(
      "Missing encryption secret. Please configure META_TOKEN_ENCRYPTION_KEY or TOKEN_ENCRYPTION_SECRET."
    );
  }

  // If secret is already a 64-character hex string (32 bytes), parse it directly
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  // Otherwise derive a deterministic 32-byte key using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext secret string using AES-256-GCM
 * Output format: "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Invalid input: plaintext must be a non-empty string");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an encrypted token string using AES-256-GCM
 * Verifies authenticity before returning the plaintext
 */
export function decryptToken(encryptedPayload: string): string {
  if (!encryptedPayload || typeof encryptedPayload !== "string") {
    throw new Error("Invalid input: encrypted payload must be a non-empty string");
  }

  const parts = encryptedPayload.split(":");
  if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "v1") {
    throw new Error("Invalid or unsupported ciphertext format");
  }

  const ivHex = parts[2];
  const tagHex = parts[3];
  const ciphertextHex = parts[4];

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Corrupted ciphertext parameters");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  try {
    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    // Deliberately do not include ciphertext details in error message
    throw new Error("Decryption failed: Token ciphertext is invalid or has been tampered with");
  }
}

/**
 * Generates a cryptographically secure 256-bit random hex key suitable for TOKEN_ENCRYPTION_SECRET
 */
export function generateRandomEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
