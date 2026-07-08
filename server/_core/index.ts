import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Scheduled task handler for daily todo generation at 4:44 AM
  app.post("/api/scheduled/generate-daily-todo", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todos = [
        { id: "1", title: "Review Phase 2 core modules", completed: false, priority: "high" },
        { id: "2", title: "Implement Tier 1 features", completed: false, priority: "high" },
        { id: "3", title: "Deploy to production", completed: false, priority: "medium" },
        { id: "4", title: "Set up CI/CD pipeline", completed: false, priority: "medium" },
        { id: "5", title: "Push to all 30 repositories", completed: false, priority: "high" },
      ];
      console.log(`[4:44 AM] Generated daily todo list for ${today}`);
      res.json({ ok: true, date: today, todoCount: todos.length, generatedAt: new Date() });
    } catch (error) {
      console.error("[4:44 AM] Error generating daily todo:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
