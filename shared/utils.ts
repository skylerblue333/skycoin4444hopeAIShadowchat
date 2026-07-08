/**
 * SHARED UTILITY LIBRARY
 * Validation, formatting, crypto, permissions, and common helpers
 * used across both client and server.
 */

// ═══════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════

export const Validators = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },

  /**
   * Validate username (3-30 chars, alphanumeric + underscore)
   */
  isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  },

  /**
   * Validate display name (1-50 chars, no special control chars)
   */
  isValidDisplayName(name: string): boolean {
    if (name.length < 1 || name.length > 50) return false;
    // eslint-disable-next-line no-control-regex
    const controlChars = /[\x00-\x1F\x7F]/;
    return !controlChars.test(name);
  },

  /**
   * Validate password strength
   */
  isStrongPassword(password: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (password.length < 8) issues.push("Must be at least 8 characters");
    if (password.length > 128) issues.push("Must be at most 128 characters");
    if (!/[A-Z]/.test(password)) issues.push("Must contain uppercase letter");
    if (!/[a-z]/.test(password)) issues.push("Must contain lowercase letter");
    if (!/[0-9]/.test(password)) issues.push("Must contain a number");
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      issues.push("Must contain a special character");
    }
    return { valid: issues.length === 0, issues };
  },

  /**
   * Validate wallet address format (generic crypto address)
   */
  isValidWalletAddress(address: string): boolean {
    // Supports ETH-like (0x...) and Solana-like (base58) addresses
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return ethRegex.test(address) || solRegex.test(address);
  },

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Validate token amount (positive, max 18 decimals)
   */
  isValidTokenAmount(amount: string): boolean {
    const amountRegex = /^\d+(\.\d{1,18})?$/;
    if (!amountRegex.test(amount)) return false;
    const num = parseFloat(amount);
    return num > 0 && num < 1e18;
  },

  /**
   * Validate hex color
   */
  isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  /**
   * Validate slug format
   */
  isValidSlug(slug: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 100;
  },

  /**
   * Validate content length with unicode awareness
   */
  isValidContent(content: string, minLength: number = 1, maxLength: number = 5000): boolean {
    const length = Array.from(content).length; // Unicode-aware length
    return length >= minLength && length <= maxLength;
  },

  /**
   * Validate file upload
   */
  isValidFileUpload(file: { size: number; type: string }, options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }): { valid: boolean; reason?: string } {
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options?.allowedTypes || [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/webm",
      "audio/mpeg", "audio/wav",
    ];

    if (file.size > maxSize) {
      return { valid: false, reason: `File too large. Max: ${formatFileSize(maxSize)}` };
    }
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, reason: `File type not allowed: ${file.type}` };
    }
    return { valid: true };
  },

  /**
   * Validate pagination params
   */
  isValidPagination(page: number, limit: number): { valid: boolean; reason?: string } {
    if (!Number.isInteger(page) || page < 1) {
      return { valid: false, reason: "Page must be a positive integer" };
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return { valid: false, reason: "Limit must be between 1 and 100" };
    }
    return { valid: true };
  },

  /**
   * Validate date range
   */
  isValidDateRange(start: Date, end: Date): boolean {
    return start < end && end.getTime() - start.getTime() <= 365 * 24 * 60 * 60 * 1000;
  },
};

// ═══════════════════════════════════════════════════════════════
// FORMATTING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Format a number with commas (e.g., 1,234,567)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format a number in compact form (e.g., 1.2K, 3.4M)
 */
export function formatCompact(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format a token amount with proper decimals
 */
export function formatTokenAmount(amount: number | string, decimals: number = 2): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

/**
 * Format file size in human-readable form
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | number): string {
  const now = Date.now();
  const timestamp = typeof date === "number" ? date : date.getTime();
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);
  const isPast = diff > 0;

  const units: Array<[number, string]> = [
    [60000, "minute"],
    [3600000, "hour"],
    [86400000, "day"],
    [604800000, "week"],
    [2592000000, "month"],
    [31536000000, "year"],
  ];

  if (absDiff < 60000) return isPast ? "just now" : "in a moment";

  for (let i = units.length - 1; i >= 0; i--) {
    const [ms, unit] = units[i];
    if (absDiff >= ms) {
      const value = Math.floor(absDiff / ms);
      const plural = value > 1 ? "s" : "";
      return isPast ? `${value} ${unit}${plural} ago` : `in ${value} ${unit}${plural}`;
    }
  }

  return isPast ? "just now" : "soon";
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = "SKY444"): string {
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`;
  }
  return `${formatTokenAmount(amount)} ${currency}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Truncate wallet address (0x1234...5678)
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

// ═══════════════════════════════════════════════════════════════
// CRYPTO & HASHING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a random hex string
 */
export function randomHex(length: number = 32): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor((Math.random()) * chars.length)];
  }
  return result;
}

/**
 * Generate a random alphanumeric string
 */
export function randomAlphanumeric(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor((Math.random()) * chars.length)];
  }
  return result;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = ((Math.random()) * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Simple hash function (not cryptographic, for client-side use)
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic color from a string (for avatars)
 */
export function stringToColor(str: string): string {
  const hash = simpleHash(str);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxChars: number = 2): string {
  return name
    .split(/\s+/)
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, maxChars)
    .join("")
    .toUpperCase();
}

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS & ROLE UTILITIES
// ═══════════════════════════════════════════════════════════════

export type UserRole = "user" | "creator" | "moderator" | "admin";

export type Permission =
  | "read:posts"
  | "write:posts"
  | "delete:posts"
  | "read:users"
  | "write:users"
  | "delete:users"
  | "read:communities"
  | "write:communities"
  | "delete:communities"
  | "manage:communities"
  | "read:marketplace"
  | "write:marketplace"
  | "manage:marketplace"
  | "read:streams"
  | "write:streams"
  | "manage:streams"
  | "read:analytics"
  | "write:analytics"
  | "manage:moderation"
  | "manage:users"
  | "manage:platform"
  | "manage:payouts"
  | "manage:tokens"
  | "create:tournaments"
  | "manage:tournaments"
  | "create:guilds"
  | "manage:guilds"
  | "create:subscriptions"
  | "manage:subscriptions"
  | "access:admin"
  | "access:creator_dashboard"
  | "access:mod_tools";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    "read:posts", "write:posts",
    "read:users",
    "read:communities", "write:communities",
    "read:marketplace", "write:marketplace",
    "read:streams",
    "create:guilds",
  ],
  creator: [
    "read:posts", "write:posts", "delete:posts",
    "read:users",
    "read:communities", "write:communities",
    "read:marketplace", "write:marketplace",
    "read:streams", "write:streams",
    "read:analytics",
    "create:guilds",
    "create:subscriptions", "manage:subscriptions",
    "create:tournaments",
    "access:creator_dashboard",
  ],
  moderator: [
    "read:posts", "write:posts", "delete:posts",
    "read:users", "write:users",
    "read:communities", "write:communities", "manage:communities",
    "read:marketplace", "write:marketplace", "manage:marketplace",
    "read:streams", "write:streams", "manage:streams",
    "read:analytics",
    "manage:moderation",
    "create:guilds", "manage:guilds",
    "create:tournaments", "manage:tournaments",
    "access:creator_dashboard",
    "access:mod_tools",
  ],
  admin: [
    "read:posts", "write:posts", "delete:posts",
    "read:users", "write:users", "delete:users",
    "read:communities", "write:communities", "delete:communities", "manage:communities",
    "read:marketplace", "write:marketplace", "manage:marketplace",
    "read:streams", "write:streams", "manage:streams",
    "read:analytics", "write:analytics",
    "manage:moderation",
    "manage:users",
    "manage:platform",
    "manage:payouts",
    "manage:tokens",
    "create:guilds", "manage:guilds",
    "create:tournaments", "manage:tournaments",
    "create:subscriptions", "manage:subscriptions",
    "access:admin",
    "access:creator_dashboard",
    "access:mod_tools",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role A is higher than role B
 */
export function isHigherRole(roleA: UserRole, roleB: UserRole): boolean {
  const hierarchy: UserRole[] = ["user", "creator", "moderator", "admin"];
  return hierarchy.indexOf(roleA) > hierarchy.indexOf(roleB);
}

/**
 * Get the highest role from a list
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  const hierarchy: UserRole[] = ["user", "creator", "moderator", "admin"];
  let highest: UserRole = "user";
  for (const role of roles) {
    if (hierarchy.indexOf(role) > hierarchy.indexOf(highest)) {
      highest = role;
    }
  }
  return highest;
}

// ═══════════════════════════════════════════════════════════════
// DATE & TIME UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get start of day in UTC
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in UTC
 */
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week (Monday) in UTC
 */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of month in UTC
 */
export function startOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if a date is within the last N hours
 */
export function isWithinHours(date: Date, hours: number): boolean {
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000;
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(date: Date, days: number): boolean {
  return Date.now() - date.getTime() < days * 24 * 60 * 60 * 1000;
}

/**
 * Get the number of days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════════════════════
// ARRAY & OBJECT UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Group array items by a key
 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

/**
 * Remove duplicates from array by key
 */
export function uniqueBy<T>(items: T[], keyFn: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return items.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (
      sourceVal && typeof sourceVal === "object" && !Array.isArray(sourceVal) &&
      targetVal && typeof targetVal === "object" && !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      ) as T[keyof T];
    } else {
      result[key] = sourceVal as T[keyof T];
    }
  }
  return result;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelay?: number; maxDelay?: number }
): Promise<T> {
  const maxAttempts = options?.maxAttempts || 3;
  const baseDelay = options?.baseDelay || 1000;
  const maxDelay = options?.maxDelay || 30000;

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxAttempts) break;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// ═══════════════════════════════════════════════════════════════
// TOKEN ECONOMICS UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate staking APY based on lock period
 */
export function calculateStakingAPY(baserate: number, lockDays: number): number {
  // Longer lock = higher APY (up to 3x multiplier at 365 days)
  const multiplier = 1 + (lockDays / 365) * 2;
  return baserate * multiplier;
}

/**
 * Calculate token vesting schedule
 */
export function calculateVestingSchedule(params: {
  totalAmount: number;
  cliffMonths: number;
  vestingMonths: number;
  startDate: Date;
}): Array<{ date: Date; amount: number; cumulative: number }> {
  const schedule: Array<{ date: Date; amount: number; cumulative: number }> = [];
  const monthlyAmount = params.totalAmount / params.vestingMonths;
  let cumulative = 0;

  for (let month = 0; month < params.vestingMonths; month++) {
    const date = new Date(params.startDate);
    date.setMonth(date.getMonth() + params.cliffMonths + month);

    const amount = month === params.vestingMonths - 1
      ? params.totalAmount - cumulative // Last month gets remainder
      : monthlyAmount;

    cumulative += amount;
    schedule.push({ date, amount, cumulative });
  }

  return schedule;
}

/**
 * Calculate token burn rate
 */
export function calculateBurnRate(params: {
  transactionVolume: number;
  burnPercentage: number;
  period: "daily" | "weekly" | "monthly";
}): { burnAmount: number; annualizedBurn: number } {
  const burnAmount = params.transactionVolume * (params.burnPercentage / 100);
  const multiplier = params.period === "daily" ? 365 : params.period === "weekly" ? 52 : 12;
  return {
    burnAmount,
    annualizedBurn: burnAmount * multiplier,
  };
}

/**
 * Calculate liquidity pool share
 */
export function calculatePoolShare(params: {
  userLiquidity: number;
  totalPoolLiquidity: number;
  poolFees24h: number;
}): { sharePercentage: number; estimatedDailyFees: number; estimatedAPR: number } {
  const sharePercentage = params.totalPoolLiquidity > 0
    ? params.userLiquidity / params.totalPoolLiquidity
    : 0;
  const estimatedDailyFees = params.poolFees24h * sharePercentage;
  const estimatedAPR = params.userLiquidity > 0
    ? (estimatedDailyFees * 365) / params.userLiquidity
    : 0;

  return { sharePercentage, estimatedDailyFees, estimatedAPR };
}

// ═══════════════════════════════════════════════════════════════
// CONTENT UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Extract hashtags from content
 */
export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z0-9_]+/g);
  return matches ? Array.from(new Set(matches.map(t => t.toLowerCase()))) : [];
}

/**
 * Extract mentions from content
 */
export function extractMentions(content: string): string[] {
  const matches = content.match(/@[a-zA-Z0-9_]+/g);
  return matches ? Array.from(new Set(matches.map(m => m.slice(1)))) : [];
}

/**
 * Extract URLs from content
 */
export function extractUrls(content: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>]+/g;
  const matches = content.match(urlRegex);
  return matches || [];
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Strip markdown-like formatting
  const plain = content
    .replace(/[#*_~`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;

  // Cut at word boundary
  const truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/**
 * Detect content language (basic heuristic)
 */
export function detectLanguage(content: string): string {
  // CJK characters
  if (/[\u4e00-\u9fff]/.test(content)) return "zh";
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(content)) return "ja";
  if (/[\uac00-\ud7af]/.test(content)) return "ko";
  // Arabic
  if (/[\u0600-\u06ff]/.test(content)) return "ar";
  // Cyrillic
  if (/[\u0400-\u04ff]/.test(content)) return "ru";
  // Default to English
  return "en";
}
