import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize user input strings
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .slice(0, 1000); // Limit length
}

/**
 * Validate and sanitize email
 */
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .transform((email) => email.toLowerCase().trim())
  .refine((email) => email.length <= 255, "Email too long");

/**
 * Validate and sanitize username
 */
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
  .transform((username) => sanitizeString(username));

/**
 * Validate and sanitize password
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Validate and sanitize bio/description
 */
export const bioSchema = z
  .string()
  .max(500, "Bio must be at most 500 characters")
  .transform((bio) => sanitizeString(bio));

/**
 * Validate and sanitize URL
 */
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL too long")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, "URL must use HTTP or HTTPS");

/**
 * Validate and sanitize amount (financial)
 */
export const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, "Invalid amount format")
  .transform((amount) => amount)
  .refine((amount) => {
    const num = parseFloat(amount);
    return num > 0 && num <= Number.MAX_SAFE_INTEGER;
  }, "Amount must be positive and within valid range");

/**
 * Validate UUID
 */
export const uuidSchema = z
  .string()
  .uuid("Invalid UUID format");

/**
 * Validate TOTP token
 */
export const totpTokenSchema = z
  .string()
  .length(6, "TOTP token must be 6 digits")
  .regex(/^\d+$/, "TOTP token must contain only digits");

/**
 * Validate recovery code
 */
export const recoveryCodeSchema = z
  .string()
  .min(8, "Recovery code too short")
  .max(20, "Recovery code too long")
  .transform((code) => code.toUpperCase().replace(/[\s-]/g, ""))
  .refine((code) => /^[A-Z0-9]+$/.test(code), "Recovery code must contain only alphanumeric characters");

/**
 * Create a sanitized input validator
 */
export function createInputValidator<T extends z.ZodType>(schema: T) {
  return (input: unknown): z.infer<T> => {
    return schema.parse(input);
  };
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 * Validate pagination parameters
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Validate search query
 */
export const searchQuerySchema = z
  .string()
  .min(1, "Search query cannot be empty")
  .max(256, "Search query too long")
  .transform((query) => sanitizeString(query));
