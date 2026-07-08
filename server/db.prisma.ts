// @ts-nocheck
/**
 * Prisma Client Singleton
 * 
 * Ensures a single instance of PrismaClient is used across the application.
 * Prevents "too many connections" errors in development and production.
 * 
 * Usage:
 * ```
 * import { prisma } from './db.prisma';
 * 
 * const user = await prisma.user.findUnique({
 *   where: { id: 'user-123' }
 * });
 * ```
 */

import { PrismaClient } from '../generated/prisma/client.ts';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Disconnect Prisma on application shutdown
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', message: 'Database connection OK' };
  } catch (error) {
    return { status: 'unhealthy', message: `Database connection failed: ${error}` };
  }
}

/**
 * Transaction helper for multi-step operations
 */
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx as PrismaClient);
  });
}
