import fs from "fs";
import path from "path";

/**
 * Comprehensive Logging System
 * Logs security events, audit trails, and system activities
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
export type LogCategory =
  | "AUTH"
  | "SECURITY"
  | "AUDIT"
  | "API"
  | "DATABASE"
  | "PAYMENT"
  | "ERROR"
  | "SYSTEM";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  status?: "SUCCESS" | "FAILURE" | "PENDING";
  details?: Record<string, any>;
  error?: string;
  stackTrace?: string;
}

const LOG_DIR = process.env.LOG_DIR || "./.manus-logs";
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Format log entry as JSON
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify({
    ...entry,
    timestamp: new Date(entry.timestamp).toISOString(),
  });
}

/**
 * Get log file path for category
 */
function getLogFilePath(category: LogCategory): string {
  const filename = `${category.toLowerCase()}.log`;
  return path.join(LOG_DIR, filename);
}

/**
 * Write log entry to file
 */
function writeLogToFile(entry: LogEntry): void {
  try {
    const filePath = getLogFilePath(entry.category);
    const logLine = formatLogEntry(entry) + "\n";

    fs.appendFileSync(filePath, logLine, { encoding: "utf-8" });

    // Also write to combined log
    const combinedPath = path.join(LOG_DIR, "combined.log");
    fs.appendFileSync(combinedPath, logLine, { encoding: "utf-8" });
  } catch (error) {
    console.error("Failed to write log entry:", error);
  }
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  action: string,
  status: "SUCCESS" | "FAILURE",
  userId?: string,
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: status === "SUCCESS" ? "INFO" : "WARN",
    category: "AUTH",
    message: `Authentication ${action}: ${status}`,
    userId,
    action,
    status,
    details,
  };

  writeLogToFile(entry);
  console.log(`[AUTH] ${action}: ${status}`, details);
}

/**
 * Log security event
 */
export function logSecurityEvent(
  message: string,
  level: LogLevel,
  userId?: string,
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category: "SECURITY",
    message,
    userId,
    details,
  };

  writeLogToFile(entry);
  console.log(`[SECURITY] ${message}`, details);
}

/**
 * Log audit event
 */
export function logAuditEvent(
  action: string,
  resource: string,
  userId: string,
  status: "SUCCESS" | "FAILURE",
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "INFO",
    category: "AUDIT",
    message: `Audit: ${action} on ${resource}`,
    userId,
    action,
    resource,
    status,
    details,
  };

  writeLogToFile(entry);
  console.log(`[AUDIT] ${action} on ${resource}: ${status}`, details);
}

/**
 * Log API request
 */
export function logAPIRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  ipAddress?: string
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: statusCode >= 400 ? "WARN" : "DEBUG",
    category: "API",
    message: `${method} ${path} - ${statusCode}`,
    userId,
    ipAddress,
    action: `${method} ${path}`,
    status: statusCode < 400 ? "SUCCESS" : "FAILURE",
    details: {
      statusCode,
      duration,
    },
  };

  writeLogToFile(entry);
}

/**
 * Log database operation
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  status: "SUCCESS" | "FAILURE",
  duration: number,
  userId?: string,
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: status === "SUCCESS" ? "DEBUG" : "ERROR",
    category: "DATABASE",
    message: `Database ${operation} on ${table}`,
    userId,
    action: operation,
    resource: table,
    status,
    details: {
      ...details,
      duration,
    },
  };

  writeLogToFile(entry);
}

/**
 * Log payment transaction
 */
export function logPaymentTransaction(
  transactionId: string,
  amount: string,
  status: "SUCCESS" | "FAILURE" | "PENDING",
  userId: string,
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: status === "FAILURE" ? "ERROR" : "INFO",
    category: "PAYMENT",
    message: `Payment transaction ${transactionId}: ${status}`,
    userId,
    action: "PAYMENT",
    resource: transactionId,
    status,
    details: {
      ...details,
      amount,
    },
  };

  writeLogToFile(entry);
  console.log(`[PAYMENT] Transaction ${transactionId}: ${status}`, { amount, ...details });
}

/**
 * Log error
 */
export function logError(
  message: string,
  error: Error,
  userId?: string,
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "ERROR",
    category: "ERROR",
    message,
    userId,
    error: error.message,
    stackTrace: error.stack,
    details,
  };

  writeLogToFile(entry);
  console.error(`[ERROR] ${message}`, error, details);
}

/**
 * Log critical event
 */
export function logCritical(
  message: string,
  userId?: string,
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "CRITICAL",
    category: "SYSTEM",
    message,
    userId,
    details,
  };

  writeLogToFile(entry);
  console.error(`[CRITICAL] ${message}`, details);
}

/**
 * Log MFA event
 */
export function logMFAEvent(
  action: string,
  status: "SUCCESS" | "FAILURE",
  userId: string,
  details?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: status === "SUCCESS" ? "INFO" : "WARN",
    category: "SECURITY",
    message: `MFA ${action}: ${status}`,
    userId,
    action: `MFA_${action}`,
    status,
    details,
  };

  writeLogToFile(entry);
  console.log(`[MFA] ${action}: ${status}`, details);
}

/**
 * Log rate limit event
 */
export function logRateLimitEvent(
  key: string,
  limit: number,
  userId?: string,
  ipAddress?: string
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "WARN",
    category: "SECURITY",
    message: `Rate limit exceeded for ${key}`,
    userId,
    ipAddress,
    action: "RATE_LIMIT_EXCEEDED",
    details: {
      key,
      limit,
    },
  };

  writeLogToFile(entry);
  console.warn(`[RATE_LIMIT] ${key} exceeded limit of ${limit}`);
}

/**
 * Get logs for a specific category
 */
export function getLogs(category: LogCategory, limit: number = 100): LogEntry[] {
  try {
    const filePath = getLogFilePath(category);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n");

    return lines
      .slice(-limit)
      .map((line) => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry) => entry !== null) as LogEntry[];
  } catch (error) {
    console.error("Failed to read logs:", error);
    return [];
  }
}

/**
 * Search logs by criteria
 */
export function searchLogs(
  category: LogCategory,
  criteria: {
    userId?: string;
    action?: string;
    status?: string;
    level?: LogLevel;
    startTime?: Date;
    endTime?: Date;
  },
  limit: number = 100
): LogEntry[] {
  const logs = getLogs(category, limit * 10); // Get more to filter

  return logs
    .filter((entry) => {
      if (criteria.userId && entry.userId !== criteria.userId) return false;
      if (criteria.action && entry.action !== criteria.action) return false;
      if (criteria.status && entry.status !== criteria.status) return false;
      if (criteria.level && entry.level !== criteria.level) return false;

      const entryTime = new Date(entry.timestamp);
      if (criteria.startTime && entryTime < criteria.startTime) return false;
      if (criteria.endTime && entryTime > criteria.endTime) return false;

      return true;
    })
    .slice(-limit);
}

/**
 * Clear logs older than specified days
 */
export function clearOldLogs(daysOld: number = 30): void {
  try {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    const categories: LogCategory[] = [
      "AUTH",
      "SECURITY",
      "AUDIT",
      "API",
      "DATABASE",
      "PAYMENT",
      "ERROR",
      "SYSTEM",
    ];

    for (const category of categories) {
      const filePath = getLogFilePath(category);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.trim().split("\n");

      const recentLines = lines
        .map((line) => {
          try {
            const entry = JSON.parse(line) as LogEntry;
            return new Date(entry.timestamp).getTime() > cutoffTime ? line : null;
          } catch {
            return null;
          }
        })
        .filter((line) => line !== null);

      fs.writeFileSync(filePath, recentLines.join("\n") + "\n", "utf-8");
    }

    console.log(`Cleared logs older than ${daysOld} days`);
  } catch (error) {
    console.error("Failed to clear old logs:", error);
  }
}

export default {
  logAuthEvent,
  logSecurityEvent,
  logAuditEvent,
  logAPIRequest,
  logDatabaseOperation,
  logPaymentTransaction,
  logError,
  logCritical,
  logMFAEvent,
  logRateLimitEvent,
  getLogs,
  searchLogs,
  clearOldLogs,
};
