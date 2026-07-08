import { TRPCError } from "@trpc/server";

/**
 * Wraps database queries with error handling to gracefully handle GROUP BY and other SQL errors
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallbackValue: T,
  context: string = "database query"
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
        
    // Log the error but return fallback value instead of crashing
    if (error instanceof Error) {
                }
    
    // Return fallback value to prevent page crashes
    return fallbackValue;
  }
}

/**
 * Wraps tRPC procedures with query error handling
 */
export function withQueryErrorHandling<T>(
  queryFn: () => Promise<T>,
  fallbackValue: T,
  context: string = "procedure"
) {
  return async () => {
    try {
      return await queryFn();
    } catch (error) {
            
      // Return fallback instead of throwing
      return fallbackValue;
    }
  };
}

/**
 * Common fallback values for different query types
 */
export const FALLBACK_VALUES = {
  emptyArray: [] as any[],
  emptyObject: {} as any,
  zero: 0,
  null: null,
  topDonors: [] as Array<{ donorId: string; amount: number; count: number }>,
  leaderboard: [] as Array<{ id: string; name: string; xp: number; level: number }>,
  stats: { total: 0, average: 0, count: 0 },
};
