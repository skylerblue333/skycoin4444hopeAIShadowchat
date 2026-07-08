import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export class AutoPublishService {
  private publishInterval: NodeJS.Timeout | null = null;
  private lastPublishTime: number = 0;
  private publishQueue: string[] = [];

  start() {
        
    // Publish every 5 minutes
    this.publishInterval = setInterval(() => {
      this.attemptPublish();
    }, 5 * 60 * 1000);

    // Initial publish
    this.attemptPublish();
  }

  private attemptPublish() {
    try {
      const now = Date.now();
      const timeSinceLastPublish = now - this.lastPublishTime;

      if (timeSinceLastPublish < 2 * 60 * 1000) {
                return;
      }

      
      // 1. Build
            execSync("pnpm run build", { stdio: "inherit" });

      // 2. Test
            execSync("pnpm run test", { stdio: "inherit" });

      // 3. Lint
            execSync("pnpm run lint", { stdio: "inherit" });

      // 4. Deploy
            const deployScript = path.join(process.cwd(), "deploy.sh");
      if (fs.existsSync(deployScript)) {
        execSync(`bash ${deployScript}`, { stdio: "inherit" });
      }

      this.lastPublishTime = now;
      
      // Notify
      this.sendNotification("SKYCOIN4444 deployed successfully", "success");
    } catch (error) {
            this.sendNotification("SKYCOIN4444 deployment failed", "error");
    }
  }

  private sendNotification(message: string, level: "success" | "error") {
    console.log(`[AutoPublishService] ${level.toUpperCase()}: ${message}`);
  }

  stop() {
    if (this.publishInterval) {
      clearInterval(this.publishInterval);
    }
  }
}

export const autoPublishService = new AutoPublishService();