import crypto from "crypto";

/**
 * Encryption utilities for sensitive data at rest
 * Uses AES-256-GCM for authenticated encryption
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const ALGORITHM = "aes-256-gcm";

interface EncryptedData {
  iv: string;
  encryptedData: string;
  authTag: string;
}

/**
 * Encrypt sensitive data
 */
export function encrypt(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encrypted: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(encrypted.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encrypted.authTag, "hex"));

  let decrypted = decipher.update(encrypted.encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hash sensitive data (one-way)
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a secure random code
 */
export function generateSecureCode(length: number = 6): string {
  const characters = "0123456789";
  let code = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += characters[bytes[i] % characters.length];
  }
  return code;
}

/**
 * Verify a token matches a hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashSensitiveData(token);
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}

/**
 * Create a hash for verification
 */
export function createTokenHash(token: string): string {
  return hashSensitiveData(token);
}

/**
 * Encrypt and encode for storage
 */
export function encryptForStorage(plaintext: string): string {
  const encrypted = encrypt(plaintext);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt and decode from storage
 */
export function decryptFromStorage(encoded: string): string {
  const encrypted = JSON.parse(encoded) as EncryptedData;
  return decrypt(encrypted);
}

/**
 * Mask sensitive information for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return "*".repeat(data.length);
  }
  const visible = data.slice(-visibleChars);
  const masked = "*".repeat(data.length - visibleChars);
  return masked + visible;
}

/**
 * Validate encryption key format
 */
export function validateEncryptionKey(key: string): boolean {
  try {
    const buffer = Buffer.from(key, "hex");
    return buffer.length === 32; // 256 bits
  } catch {
    return false;
  }
}

export default {
  encrypt,
  decrypt,
  hashSensitiveData,
  generateToken,
  generateSecureCode,
  verifyTokenHash,
  createTokenHash,
  encryptForStorage,
  decryptFromStorage,
  maskSensitiveData,
  validateEncryptionKey,
};
