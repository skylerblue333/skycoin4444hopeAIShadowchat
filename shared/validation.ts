/**
 * VALIDATION & PERMISSIONS LIBRARY
 * Comprehensive input validation, permission checking,
 * role-based access control, and data integrity utilities.
 */

// ═══════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: string;
    value?: unknown;
    message?: string;
  }>;
}

/**
 * Validate an email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (email.length > 254) {
    errors.push("Email must be less than 254 characters");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  } else {
    const [local, domain] = email.split("@");
    if (local.length > 64) errors.push("Local part must be less than 64 characters");
    if (!domain || domain.length < 3) errors.push("Invalid domain");
    if (domain && !domain.includes(".")) errors.push("Domain must contain a dot");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a username
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push("Username is required");
  } else {
    if (username.length < 3) errors.push("Username must be at least 3 characters");
    if (username.length > 30) errors.push("Username must be less than 30 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.push("Username can only contain letters, numbers, and underscores");
    if (/^[0-9]/.test(username)) errors.push("Username cannot start with a number");
    if (username.startsWith("_") || username.endsWith("_")) errors.push("Username cannot start or end with underscore");
    if (/__/.test(username)) errors.push("Username cannot contain consecutive underscores");

    // Reserved words
    const reserved = ["admin", "moderator", "system", "support", "help", "root", "null", "undefined", "api", "www"];
    if (reserved.includes(username.toLowerCase())) {
      errors.push("This username is reserved");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a display name
 */
export function validateDisplayName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push("Display name is required");
  } else {
    if (name.length < 1) errors.push("Display name must be at least 1 character");
    if (name.length > 50) errors.push("Display name must be less than 50 characters");
    if (/[<>{}[\]\\]/.test(name)) errors.push("Display name contains invalid characters");
    if (/^\s|\s$/.test(name)) errors.push("Display name cannot start or end with whitespace");
    if (/\s{2,}/.test(name)) errors.push("Display name cannot contain consecutive spaces");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a password
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) errors.push("Password must be at least 8 characters");
    if (password.length > 128) errors.push("Password must be less than 128 characters");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    // Common password check
    const common = ["password", "12345678", "qwerty", "letmein", "admin123"];
    if (common.includes(password.toLowerCase())) {
      errors.push("This password is too common");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a URL
 */
export function validateUrl(url: string, options?: {
  requireHttps?: boolean;
  allowedDomains?: string[];
}): ValidationResult {
  const errors: string[] = [];

  if (!url || url.trim().length === 0) {
    errors.push("URL is required");
    return { valid: false, errors };
  }

  try {
    const parsed = new URL(url);

    if (options?.requireHttps && parsed.protocol !== "https:") {
      errors.push("URL must use HTTPS");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      errors.push("URL must use HTTP or HTTPS protocol");
    }

    if (options?.allowedDomains && options.allowedDomains.length > 0) {
      const isAllowed = options.allowedDomains.some(d =>
        parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
      );
      if (!isAllowed) {
        errors.push(`URL domain not allowed. Allowed: ${options.allowedDomains.join(", ")}`);
      }
    }

    if (url.length > 2048) {
      errors.push("URL must be less than 2048 characters");
    }
  } catch {
    errors.push("Invalid URL format");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a token amount
 */
export function validateTokenAmount(amount: number | string, options?: {
  min?: number;
  max?: number;
  decimals?: number;
}): ValidationResult {
  const errors: string[] = [];
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    errors.push("Amount must be a valid number");
  } else {
    if (num <= 0) errors.push("Amount must be greater than 0");
    if (options?.min !== undefined && num < options.min) {
      errors.push(`Amount must be at least ${options.min}`);
    }
    if (options?.max !== undefined && num > options.max) {
      errors.push(`Amount must be less than ${options.max}`);
    }
    if (options?.decimals !== undefined) {
      const decimalPart = num.toString().split(".")[1];
      if (decimalPart && decimalPart.length > options.decimals) {
        errors.push(`Amount cannot have more than ${options.decimals} decimal places`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a wallet address (generic crypto format)
 */
export function validateWalletAddress(address: string): ValidationResult {
  const errors: string[] = [];

  if (!address || address.trim().length === 0) {
    errors.push("Wallet address is required");
  } else {
    if (address.length < 26 || address.length > 62) {
      errors.push("Invalid wallet address length");
    }
    if (!/^[a-zA-Z0-9]+$/.test(address)) {
      errors.push("Wallet address contains invalid characters");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate post content
 */
export function validatePostContent(content: string, options?: {
  minLength?: number;
  maxLength?: number;
  allowHtml?: boolean;
}): ValidationResult {
  const errors: string[] = [];
  const min = options?.minLength || 1;
  const max = options?.maxLength || 5000;

  if (!content || content.trim().length === 0) {
    errors.push("Content is required");
  } else {
    if (content.trim().length < min) errors.push(`Content must be at least ${min} characters`);
    if (content.length > max) errors.push(`Content must be less than ${max} characters`);

    if (!options?.allowHtml) {
      if (/<script/i.test(content)) errors.push("Content cannot contain script tags");
      if (/on\w+\s*=/i.test(content)) errors.push("Content cannot contain event handlers");
      if (/javascript:/i.test(content)) errors.push("Content cannot contain javascript: URLs");
    }

    // Check for spam patterns
    if (/(.)\1{10,}/.test(content)) errors.push("Content appears to be spam (repeated characters)");
    if (content.split("\n").length > 100) errors.push("Content has too many line breaks");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generic schema validator
 */
export function validateSchema(data: Record<string, unknown>, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    for (const check of rule.rules) {
      switch (check.type) {
        case "required":
          if (value === undefined || value === null || value === "") {
            errors.push(check.message || `${rule.field} is required`);
          }
          break;
        case "string":
          if (value !== undefined && typeof value !== "string") {
            errors.push(check.message || `${rule.field} must be a string`);
          }
          break;
        case "number":
          if (value !== undefined && typeof value !== "number") {
            errors.push(check.message || `${rule.field} must be a number`);
          }
          break;
        case "min":
          if (typeof value === "string" && value.length < (check.value as number)) {
            errors.push(check.message || `${rule.field} must be at least ${check.value} characters`);
          }
          if (typeof value === "number" && value < (check.value as number)) {
            errors.push(check.message || `${rule.field} must be at least ${check.value}`);
          }
          break;
        case "max":
          if (typeof value === "string" && value.length > (check.value as number)) {
            errors.push(check.message || `${rule.field} must be at most ${check.value} characters`);
          }
          if (typeof value === "number" && value > (check.value as number)) {
            errors.push(check.message || `${rule.field} must be at most ${check.value}`);
          }
          break;
        case "enum":
          if (value !== undefined && !(check.value as string[]).includes(value as string)) {
            errors.push(check.message || `${rule.field} must be one of: ${(check.value as string[]).join(", ")}`);
          }
          break;
        case "pattern":
          if (typeof value === "string" && !(check.value as RegExp).test(value)) {
            errors.push(check.message || `${rule.field} has invalid format`);
          }
          break;
        case "array":
          if (value !== undefined && !Array.isArray(value)) {
            errors.push(check.message || `${rule.field} must be an array`);
          }
          break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL (RBAC)
// ═══════════════════════════════════════════════════════════════

export type Role = "guest" | "user" | "creator" | "moderator" | "admin" | "superadmin";

export type Permission =
  // Content
  | "post:create" | "post:edit" | "post:delete" | "post:pin"
  | "comment:create" | "comment:edit" | "comment:delete"
  // Social
  | "user:follow" | "user:block" | "user:report"
  | "dm:send" | "dm:read"
  // Community
  | "community:create" | "community:edit" | "community:delete"
  | "channel:create" | "channel:edit" | "channel:delete"
  // Streaming
  | "stream:start" | "stream:end" | "stream:moderate"
  | "stream:raid" | "stream:costream"
  // Marketplace
  | "listing:create" | "listing:edit" | "listing:delete"
  | "listing:buy" | "listing:bid"
  // Financial
  | "wallet:view" | "wallet:transfer" | "wallet:withdraw"
  | "tip:send" | "subscription:manage"
  | "payout:request" | "payout:approve"
  // Gaming
  | "tournament:create" | "tournament:join"
  | "guild:create" | "guild:manage"
  // Moderation
  | "mod:warn" | "mod:mute" | "mod:ban" | "mod:unban"
  | "mod:delete_content" | "mod:review_reports"
  // Admin
  | "admin:users" | "admin:settings" | "admin:analytics"
  | "admin:payouts" | "admin:moderation"
  | "admin:system" | "admin:roles";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: [],
  user: [
    "post:create", "post:edit", "post:delete",
    "comment:create", "comment:edit", "comment:delete",
    "user:follow", "user:block", "user:report",
    "dm:send", "dm:read",
    "community:create",
    "listing:create", "listing:edit", "listing:delete",
    "listing:buy", "listing:bid",
    "wallet:view", "wallet:transfer",
    "tip:send", "subscription:manage",
    "tournament:join", "guild:create",
  ],
  creator: [
    "post:create", "post:edit", "post:delete", "post:pin",
    "comment:create", "comment:edit", "comment:delete",
    "user:follow", "user:block", "user:report",
    "dm:send", "dm:read",
    "community:create", "community:edit",
    "channel:create", "channel:edit",
    "stream:start", "stream:end", "stream:raid", "stream:costream",
    "listing:create", "listing:edit", "listing:delete",
    "listing:buy", "listing:bid",
    "wallet:view", "wallet:transfer", "wallet:withdraw",
    "tip:send", "subscription:manage",
    "payout:request",
    "tournament:create", "tournament:join",
    "guild:create", "guild:manage",
  ],
  moderator: [
    "post:create", "post:edit", "post:delete", "post:pin",
    "comment:create", "comment:edit", "comment:delete",
    "user:follow", "user:block", "user:report",
    "dm:send", "dm:read",
    "community:create", "community:edit",
    "channel:create", "channel:edit",
    "stream:start", "stream:end", "stream:moderate",
    "stream:raid", "stream:costream",
    "listing:create", "listing:edit", "listing:delete",
    "listing:buy", "listing:bid",
    "wallet:view", "wallet:transfer",
    "tip:send", "subscription:manage",
    "tournament:create", "tournament:join",
    "guild:create", "guild:manage",
    "mod:warn", "mod:mute", "mod:ban", "mod:unban",
    "mod:delete_content", "mod:review_reports",
  ],
  admin: [
    "post:create", "post:edit", "post:delete", "post:pin",
    "comment:create", "comment:edit", "comment:delete",
    "user:follow", "user:block", "user:report",
    "dm:send", "dm:read",
    "community:create", "community:edit", "community:delete",
    "channel:create", "channel:edit", "channel:delete",
    "stream:start", "stream:end", "stream:moderate",
    "stream:raid", "stream:costream",
    "listing:create", "listing:edit", "listing:delete",
    "listing:buy", "listing:bid",
    "wallet:view", "wallet:transfer", "wallet:withdraw",
    "tip:send", "subscription:manage",
    "payout:request", "payout:approve",
    "tournament:create", "tournament:join",
    "guild:create", "guild:manage",
    "mod:warn", "mod:mute", "mod:ban", "mod:unban",
    "mod:delete_content", "mod:review_reports",
    "admin:users", "admin:settings", "admin:analytics",
    "admin:payouts", "admin:moderation",
  ],
  superadmin: [
    "post:create", "post:edit", "post:delete", "post:pin",
    "comment:create", "comment:edit", "comment:delete",
    "user:follow", "user:block", "user:report",
    "dm:send", "dm:read",
    "community:create", "community:edit", "community:delete",
    "channel:create", "channel:edit", "channel:delete",
    "stream:start", "stream:end", "stream:moderate",
    "stream:raid", "stream:costream",
    "listing:create", "listing:edit", "listing:delete",
    "listing:buy", "listing:bid",
    "wallet:view", "wallet:transfer", "wallet:withdraw",
    "tip:send", "subscription:manage",
    "payout:request", "payout:approve",
    "tournament:create", "tournament:join",
    "guild:create", "guild:manage",
    "mod:warn", "mod:mute", "mod:ban", "mod:unban",
    "mod:delete_content", "mod:review_reports",
    "admin:users", "admin:settings", "admin:analytics",
    "admin:payouts", "admin:moderation",
    "admin:system", "admin:roles",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role A is higher than role B
 */
export function isHigherRole(roleA: Role, roleB: Role): boolean {
  const hierarchy: Role[] = ["guest", "user", "creator", "moderator", "admin", "superadmin"];
  return hierarchy.indexOf(roleA) > hierarchy.indexOf(roleB);
}

/**
 * Get the minimum role required for a permission
 */
export function getMinimumRole(permission: Permission): Role {
  const roles: Role[] = ["guest", "user", "creator", "moderator", "admin", "superadmin"];
  for (const role of roles) {
    if (hasPermission(role, permission)) return role;
  }
  return "superadmin";
}

// ═══════════════════════════════════════════════════════════════
// CONTENT POLICY ENGINE
// ═══════════════════════════════════════════════════════════════

export interface ContentPolicy {
  id: string;
  name: string;
  description: string;
  rules: ContentRule[];
  severity: "warning" | "removal" | "ban";
  isActive: boolean;
}

export interface ContentRule {
  type: "keyword" | "pattern" | "link" | "media" | "behavior";
  value: string;
  action: "flag" | "block" | "remove" | "shadowban";
}

const DEFAULT_POLICIES: ContentPolicy[] = [
  {
    id: "spam",
    name: "Anti-Spam",
    description: "Detect and prevent spam content",
    rules: [
      { type: "behavior", value: "rapid_posting", action: "flag" },
      { type: "behavior", value: "duplicate_content", action: "block" },
      { type: "pattern", value: "(.{5,})\\1{3,}", action: "flag" },
      { type: "link", value: "suspicious_shortener", action: "flag" },
    ],
    severity: "removal",
    isActive: true,
  },
  {
    id: "harassment",
    name: "Anti-Harassment",
    description: "Prevent targeted harassment and bullying",
    rules: [
      { type: "behavior", value: "targeted_mentions", action: "flag" },
      { type: "behavior", value: "mass_reporting", action: "flag" },
      { type: "keyword", value: "threat_keywords", action: "remove" },
    ],
    severity: "ban",
    isActive: true,
  },
  {
    id: "scam",
    name: "Anti-Scam",
    description: "Detect financial scams and phishing",
    rules: [
      { type: "keyword", value: "send_tokens_first", action: "block" },
      { type: "link", value: "known_phishing_domain", action: "remove" },
      { type: "pattern", value: "guaranteed.*profit|double.*tokens", action: "flag" },
      { type: "behavior", value: "impersonation", action: "remove" },
    ],
    severity: "ban",
    isActive: true,
  },
  {
    id: "nsfw",
    name: "NSFW Content",
    description: "Manage adult content visibility",
    rules: [
      { type: "media", value: "explicit_content", action: "flag" },
      { type: "keyword", value: "nsfw_keywords", action: "flag" },
    ],
    severity: "warning",
    isActive: true,
  },
];

/**
 * Check content against policies
 */
export function checkContentPolicies(
  content: string,
  policies?: ContentPolicy[]
): { violations: Array<{ policyId: string; rule: ContentRule; severity: string }> } {
  const activePolicies = (policies || DEFAULT_POLICIES).filter(p => p.isActive);
  const violations: Array<{ policyId: string; rule: ContentRule; severity: string }> = [];

  for (const policy of activePolicies) {
    for (const rule of policy.rules) {
      let violated = false;

      switch (rule.type) {
        case "pattern":
          try {
            violated = new RegExp(rule.value, "i").test(content);
          } catch {
            // Invalid regex, skip
          }
          break;
        case "keyword":
          // Check against keyword categories
          violated = content.toLowerCase().includes(rule.value.replace(/_/g, " "));
          break;
        case "link":
          // Check for suspicious links
          violated = /https?:\/\/[^\s]+/.test(content) && rule.value === "suspicious_shortener";
          break;
        default:
          break;
      }

      if (violated) {
        violations.push({ policyId: policy.id, rule, severity: policy.severity });
      }
    }
  }

  return { violations };
}

/**
 * Get all active policies
 */
export function getContentPolicies(): ContentPolicy[] {
  return DEFAULT_POLICIES;
}

// ═══════════════════════════════════════════════════════════════
// DATA INTEGRITY UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a deterministic hash for data integrity verification
 */
export function hashData(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a unique ID with prefix
 */
export function generateId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const random = (Math.random()).toString(36).slice(2, 10);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Validate data integrity with checksum
 */
export function verifyIntegrity(data: string, expectedHash: string): boolean {
  return hashData(data) === expectedHash;
}

/**
 * Sanitize and normalize a slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format a number with K/M/B suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: number, decimals: number = 2): string {
  if (amount === 0) return "0";
  if (amount < 0.01) return "<0.01";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculate time ago string
 */
export function timeAgo(date: Date | number): string {
  const now = Date.now();
  const timestamp = typeof date === "number" ? date : date.getTime();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

/**
 * Parse mentions from content (@username)
 */
export function parseMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}

/**
 * Parse hashtags from content (#tag)
 */
export function parseHashtags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z0-9_]+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}

/**
 * Calculate reading time for content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Validate a numeric amount within a range
 */
export function validateAmount(amount: number, min: number, max: number): ValidationResult {
  if (isNaN(amount) || !isFinite(amount)) {
    return { valid: false, errors: ["Amount must be a valid number"] };
  }
  if (amount < min) {
    return { valid: false, errors: [`Amount must be at least ${min}`] };
  }
  if (amount > max) {
    return { valid: false, errors: [`Amount must be at most ${max}`] };
  }
  return { valid: true, errors: [] };
}

/**
 * Sanitize a string by removing HTML tags and trimming
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

/**
 * Hash a string using a simple but consistent algorithm
 */
export function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate a wallet/blockchain address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
