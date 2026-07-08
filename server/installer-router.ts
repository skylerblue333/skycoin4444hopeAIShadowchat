import crypto from 'crypto';
/**
 * Server Installer tRPC Router
 * Generates Docker Compose, env files, install scripts, and health checks
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  generateEnvFile,
  generateDockerCompose,
  generateNginxConfig,
  generateInstallScript,
  runHealthChecks,
} from "./installer-engine";

export const installerRouter = router({
  // ─── Generate Config Files ───────────────────────────────────────────────
  generateFiles: protectedProcedure
    .input(
      z.object({
        projectName: z.string().default("shadowchat"),
        domain: z.string().default("yourdomain.com"),
        adminEmail: z.string().email().default("admin@yourdomain.com"),
        enableSSL: z.boolean().default(true),
        enableRedis: z.boolean().default(true),
        enableNginx: z.boolean().default(true),
        port: z.number().default(3000),
      })
    )
    .mutation(async ({ input }) => {
      const config = {
        ...input,
        dbPassword: `db_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 14)}`,
        jwtSecret: `jwt_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 22)}`,
        redisPassword: `redis_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 14)}`,
      };
      return {
        envFile: generateEnvFile(config),
        dockerCompose: generateDockerCompose(config),
        nginxConfig: generateNginxConfig(config),
        installScript: generateInstallScript(config),
      };
    }),

  // ─── Health Checks ───────────────────────────────────────────────────────
  healthCheck: publicProcedure.query(async () => {
    return runHealthChecks();
  }),
});
