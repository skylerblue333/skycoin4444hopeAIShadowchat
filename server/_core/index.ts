import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { healthRouter, healthMonitor } from "../health-monitor";
import { miningRouter as autonomousMiningRouter } from "../autonomous-mining";
import miningRouter from "../mining-router";
import walletApiRouter from "../wallet-api";
import { registerMiningHeartbeats } from "../mining-heartbeat";



function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 1000, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests." }, skip: (req) => req.path === "/api/health" });
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: "Too many auth attempts." } });
const uploadLimiter = rateLimit({ windowMs: 60*1000, max: 20, message: { error: "Upload rate limit exceeded." } });
const apiLimiter = rateLimit({ windowMs: 60*1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { error: "API rate limit exceeded." } });

function requestTimeout(ms: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const t = setTimeout(() => { if (!res.headersSent) res.status(503).json({ error: "Request timeout" }); }, ms);
    res.on("finish", () => clearTimeout(t));
    res.on("close", () => clearTimeout(t));
    next();
  };
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1); // Trust first proxy (load balancer / reverse proxy)
  const server = createServer(app);
  const isDev = process.env.NODE_ENV === "development";

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  
  // Health monitoring routes
  app.use("/api", healthRouter);
  app.use("/api/mining", miningRouter);
  app.use("/api/mining", walletApiRouter);
  app.use("/api", autonomousMiningRouter);

  // Register mining heartbeat tasks
  registerMiningHeartbeats().catch(err => console.error('Mining heartbeat error:', err));

  // Start advanced mining engine on server startup
  try {
    const { advancedMiningEngine } = await import('../advanced-mining-engine');
    console.log('[Mining] Advanced mining engine loaded');
  } catch (err) {
    console.error('[Mining] Failed to load advanced mining engine:', err);
  }
  app.use(compression({ level: 6, threshold: 1024 }) as any);
  app.use(isDev ? morgan("dev") : morgan("combined", { skip: (req) => req.path === "/api/health" }));
  app.use(globalLimiter);
  app.use(requestTimeout(30_000));

  app.get("/api/health", async (_req: Request, res: Response) => {
    let dbStatus = "unknown"; let dbLatencyMs = 0;
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (db) { const t0 = Date.now(); await db.execute("SELECT 1"); dbLatencyMs = Date.now() - t0; dbStatus = "healthy"; }
    } catch { dbStatus = "degraded"; }
    const mem = process.memoryUsage();
    res.json({ status: dbStatus === "healthy" ? "ok" : "degraded", timestamp: new Date().toISOString(), uptime: Math.floor(process.uptime()), environment: process.env.NODE_ENV || "production", services: { database: { status: dbStatus, latencyMs: dbLatencyMs }, server: { status: "healthy", memoryMB: Math.round(mem.heapUsed/1024/1024), rssMB: Math.round(mem.rss/1024/1024) } } });
  });

  app.get("/api/cache-stats", (_req: Request, res: Response) => {
    const { cacheStats, getSlowQueryLog } = require("../query-cache");
    res.json({ cache: cacheStats(), slowQueries: getSlowQueryLog().slice(-20) });
  });

  app.get("/api/metrics", (_req: Request, res: Response) => {
    const mem = process.memoryUsage(); const cpu = process.cpuUsage();
    res.json({ uptime: process.uptime(), memory: { heapUsedMB: Math.round(mem.heapUsed/1024/1024), heapTotalMB: Math.round(mem.heapTotal/1024/1024), rssMB: Math.round(mem.rss/1024/1024) }, cpu: { userMs: Math.round(cpu.user/1000), systemMs: Math.round(cpu.system/1000) }, nodeVersion: process.version, pid: process.pid });
  });

  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) { res.status(400).json({ error: "Webhook secret not configured" }); return; }
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      if (event.id.startsWith("evt_test_")) {  res.json({ verified: true }); return; }
            if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const { handleCheckoutSessionCompleted } = await import("../stripe-skycoin");
        await handleCheckoutSessionCompleted(session);
      }
      res.json({ received: true });
    } catch (err: any) {  res.status(400).json({ error: err.message }); }
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  registerStorageProxy(app);
  app.use("/api/oauth", authLimiter);
  registerOAuthRoutes(app);
  app.use("/api/upload", uploadLimiter);

  app.post("/api/scheduled/sprint", async (req: Request, res: Response) => {
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req as any);
      if (!user.isCron) { res.status(403).json({ error: "Forbidden: cron only" }); return; }
      const { runAutonomousSprint } = await import("../sprint-engine");
      const result = await runAutonomousSprint();
      res.json({ success: true, sprintNumber: result.sprintNumber, totalLinesAdded: result.totalLinesAdded, languagesUsed: result.languagesUsed });
    } catch (err) {  res.status(500).json({ error: String(err) }); }
  });

  // ─── SSE: AI Code Generation Streaming ──────────────────────────────────────
  app.get("/api/ai/code-stream", async (req: Request, res: Response) => {
    const { sdk } = await import("./sdk");
    let user: any;
    try { user = await sdk.authenticateRequest(req as any); } catch { res.status(401).json({ error: "Unauthorized" }); return; }
    const prompt = (req.query.prompt as string) || "";
    const model = (req.query.model as string) || "claude-sonnet-4-5";
    if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    let finished = false;
    res.on("close", () => { finished = true; });
    const send = (event: string, data: unknown) => {
      if (!finished && !res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    try {
      const { invokeLLM } = await import("./llm");
      send("start", { model, timestamp: Date.now() });
      const response = await invokeLLM({
        model,
        messages: [
          { role: "system", content: "You are an expert TypeScript/React developer. Generate clean, production-ready code. Output only code with brief inline comments." },
          { role: "user", content: prompt },
        ],
      });
      const content = (response as any)?.choices?.[0]?.message?.content || "";
      // Stream in chunks of 80 chars to simulate streaming
      const chunkSize = 80;
      for (let i = 0; i < content.length; i += chunkSize) {
        if (finished) break;
        send("chunk", { text: content.slice(i, i + chunkSize) });
        await new Promise(r => setTimeout(r, 20));
      }
      send("done", { totalChars: content.length, model });
    } catch (err: any) {
      send("error", { message: err.message || "Generation failed" });
    } finally {
      if (!res.writableEnded) res.end();
    }
  });

  // ─── SSE: Live Notifications ──────────────────────────────────────────────────
  const notifClients = new Map<number, Response[]>();
  app.get("/api/notifications/stream", async (req: Request, res: Response) => {
    const { sdk } = await import("./sdk");
    let user: any;
    try { user = await sdk.authenticateRequest(req as any); } catch { res.status(401).json({ error: "Unauthorized" }); return; }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const userId = user.id as number;
    if (!notifClients.has(userId)) notifClients.set(userId, []);
    notifClients.get(userId)!.push(res);
    res.write(`event: connected\ndata: ${JSON.stringify({ userId, timestamp: Date.now() })}\n\n`);
    const heartbeat = setInterval(() => { if (!res.writableEnded) res.write(":heartbeat\n\n"); }, 30_000);
    res.on("close", () => {
      clearInterval(heartbeat);
      const clients = notifClients.get(userId) || [];
      notifClients.set(userId, clients.filter(c => c !== res));
    });
  });
  // Expose broadcaster for use by notification helpers
  (global as any).__notifBroadcast = (userId: number, event: string, data: unknown) => {
    const clients = notifClients.get(userId) || [];
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(c => { if (!c.writableEnded) c.write(payload); });
  };

  app.use("/api/trpc", apiLimiter, createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code !== "UNAUTHORIZED" && error.code !== "NOT_FOUND") {
        console.error(`[tRPC] Error on ${path}:`, error);
      }
    },
  }));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = status < 500 ? err.message : "Internal server error";
    if (status >= 500) console.error('[Error]', message);
    if (!res.headersSent) res.status(status).json({ error: message });
  });

  app.use((_req: Request, res: Response, next: NextFunction) => {
    if (_req.path.startsWith("/api/")) res.status(404).json({ error: "API route not found" });
    else next();
  });

  if (isDev) { await setupVite(app, server); } else { serveStatic(app); }

  const shutdown = (signal: string) => {
        server.close(() => {  process.exit(0); });
    setTimeout(() => {  process.exit(1); }, 10_000);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    console.error('[Unhandled Rejection]', reason);
  });
  process.on("uncaughtException", (err) => {
    console.error('[Uncaught Exception]', err);
    process.exit(1);
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`[Server] Port ${preferredPort} busy, using ${port}`);
  server.listen(port, () => {
    console.log(`[Server] Listening on port ${port}`);
    // Boot autonomous engines (non-blocking)
    void (async () => {
      try {
        const { freeWillEngine } = await import("../free-will-engine.js");
        await freeWillEngine.start();
              } catch (e) {  }
      try {
        // EmergentEconomyEngine is event-driven, no explicit start needed
        await import("../emergent-economy-engine.js");
              } catch (e) {  }
      try {
        // Start autonomous mining system
        const { autonomousMining } = await import("../autonomous-mining");
        await autonomousMining.startMining();
              } catch (e) {  }
    })();
  });
}

startServer().catch(err => {  process.exit(1); });

export default startServer;
