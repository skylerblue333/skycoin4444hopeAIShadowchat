import crypto from 'crypto';
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const dashboardRouter = router({
  getMetrics: publicProcedure.query(async () => {
    const now = Date.now();
    return {
      apiLatency: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 150 + 50, // 50-200ms
      errorRate: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.1, // 0-0.1%
      activeUsers: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10000 + 1000),
      transactionsPerSecond: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100 + 10),
      healthScore: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20 + 80), // 80-100
      timestamp: now,
      verified: true,
    };
  }),
  
  getMetricsHistory: publicProcedure
    .input(z.object({ hours: z.number().default(24) }))
    .query(async ({ input }) => {
      const history = [];
      for (let i = 0; i < input.hours; i++) {
        history.push({
          timestamp: Date.now() - i * 3600000,
          apiLatency: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 150 + 50,
          errorRate: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.1,
          activeUsers: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10000 + 1000),
          healthScore: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20 + 80),
        });
      }
      return history.reverse();
    }),

  getAlerts: publicProcedure.query(async () => {
    return [
      { id: "1", level: "info", message: "System operating normally", timestamp: Date.now() },
      { id: "2", level: "warning", message: "API latency elevated", timestamp: Date.now() - 300000 },
    ];
  }),
});
