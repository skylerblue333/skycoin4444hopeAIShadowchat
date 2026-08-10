import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync, mkdirSync, createWriteStream, createReadStream, statSync, promises as fsPromises } from 'fs';
import { join } from 'path';
import { notifyOwner } from './_core/notification';

const execAsync = promisify(exec);

interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron format
  retention: number; // days
  destination: string;
  maxRetries: number;
}

interface BackupMetadata {
  id: string;
  timestamp: number;
  size: number;
  status: 'success' | 'failed' | 'partial';
  duration: number;
  tables: string[];
  checksum: string;
  restorePoint: boolean;
}

class BackupSystem {
  private config: BackupConfig = {
    enabled: true,
    schedule: '0 2 * * *', // 2 AM daily
    retention: 30, // 30 days
    destination: process.env.BACKUP_DEST || '/backups',
    maxRetries: 3,
  };

  private backups: Map<string, BackupMetadata> = new Map();
  private metadataFile: string;

  constructor() {
    this.metadataFile = join(this.config.destination, 'backups.json');
    this.ensureBackupDir();
    this.loadMetadata();
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDir() {
    if (!existsSync(this.config.destination)) {
      mkdirSync(this.config.destination, { recursive: true });
    }
  }

  /**
   * Load backup metadata from disk
   */
  private loadMetadata() {
    try {
      if (existsSync(this.metadataFile)) {
        const data = JSON.parse(readFileSync(this.metadataFile, 'utf-8'));
        this.backups = new Map(Object.entries(data));
      }
    } catch (error) {
          }
  }

  /**
   * Save backup metadata to disk
   */
  private saveMetadata() {
    try {
      const data = Object.fromEntries(this.backups);
      writeFileSync(this.metadataFile, JSON.stringify(data, null, 2));
    } catch (error) {
          }
  }

  /**
   * Create database backup
   */
  async createBackup(): Promise<BackupMetadata> {
    const startTime = Date.now();
    const backupId = `backup-${Date.now()}`;
    const backupFile = join(this.config.destination, `${backupId}.sql`);

    let retries = 0;
    let lastError: Error | null = null;

    while (retries < this.config.maxRetries) {
      try {
        
        // Get database URL from environment
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('DATABASE_URL not configured');

        // Extract connection details
        const urlObj = new URL(dbUrl);
        const host = urlObj.hostname;
        const user = urlObj.username;
        const password = urlObj.password;
        const database = urlObj.pathname.split('/')[1];
        const port = urlObj.port || '3306';

        // Create backup using mysqldump
        const args = [
          `-h${host}`,
          `-u${user}`,
          `-p${password}`,
          `-P${port}`,
          database,
        ];
        const mysqldumpProcess = spawn("mysqldump", args, { stdio: ["ignore", "pipe", "inherit"] });
        const outputStream = createWriteStream(backupFile);
        mysqldumpProcess.stdout.pipe(outputStream);

        await new Promise<void>((resolve, reject) => {
          mysqldumpProcess.on("close", (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`mysqldump process exited with code ${code}`));
            }
          });
          mysqldumpProcess.on("error", (err) => reject(err));
        });

        // Get backup size
        const backupSize = existsSync(backupFile) ? statSync(backupFile).size : 0;

        // Calculate checksum
        const checksumProcess = spawn("md5sum", [backupFile], { stdio: ["ignore", "pipe", "inherit"] });
        let checksumOutput = "";
        checksumProcess.stdout.on("data", (data) => (checksumOutput += data.toString()));
        await new Promise<void>((resolve, reject) => {
          checksumProcess.on("close", (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`md5sum process exited with code ${code}`));
            }
          });
          checksumProcess.on("error", (err) => reject(err));
        });
        const checksum = checksumOutput.split(" ")[0];

        const metadata: BackupMetadata = {
          id: backupId,
          timestamp: startTime,
          size: backupSize,
          status: 'success',
          duration: Date.now() - startTime,
          tables: [database],
          checksum: checksum.trim(),
          restorePoint: true,
        };

        this.backups.set(backupId, metadata);
        this.saveMetadata();

        console.log(`[BackupSystem] Backup ${backupId} created successfully (${(backupSize / 1024 / 1024).toFixed(2)} MB)`);

        // Send notification
        await notifyOwner({
          title: 'Backup Successful',
          content: `Database backup ${backupId} completed in ${metadata.duration}ms (${(backupSize / 1024 / 1024).toFixed(2)} MB)`,
        });

        return metadata;
      } catch (error) {
        lastError = error as Error;
        retries++;
        
        if (retries < this.config.maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        }
      }
    }

    // All retries failed
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: startTime,
      size: 0,
      status: 'failed',
      duration: Date.now() - startTime,
      tables: [],
      checksum: '',
      restorePoint: false,
    };

    this.backups.set(backupId, metadata);
    this.saveMetadata();

    
    // Send failure notification
    await notifyOwner({
      title: 'Backup Failed',
      content: `Database backup failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
    });

    throw lastError;
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    const metadata = this.backups.get(backupId);
    if (!metadata) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (metadata.status !== 'success') {
      throw new Error(`Backup ${backupId} is not in success state`);
    }

    try {
      const backupFile = join(this.config.destination, `${backupId}.sql`);

      // Verify checksum before restore
      const checksumProcess = spawn("md5sum", [backupFile], { stdio: ["ignore", "pipe", "inherit"] });
      let checksumOutput = "";
      checksumProcess.stdout.on("data", (data) => (checksumOutput += data.toString()));
      await new Promise<void>((resolve, reject) => {
        checksumProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`md5sum process exited with code ${code}`));
          }
        });
        checksumProcess.on("error", (err) => reject(err));
      });
      const checksum = checksumOutput.split(" ")[0];
      if (checksum.trim() !== metadata.checksum) {
        throw new Error('Backup checksum mismatch - file may be corrupted');
      }

      // Get database URL
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL not configured');

      const urlObj = new URL(dbUrl);
      const host = urlObj.hostname;
      const user = urlObj.username;
      const password = urlObj.password;
      const database = urlObj.pathname.split('/')[1];
      const port = urlObj.port || '3306';

      // Restore database
      const args = [
        `-h${host}`,
        `-u${user}`,
        `-p${password}`,
        `-P${port}`,
        database,
      ];
      const mysqlProcess = spawn("mysql", args, { stdio: ["ignore", "pipe", "inherit"] });
      const inputStream = createReadStream(backupFile);
      inputStream.pipe(mysqlProcess.stdin);

      await new Promise<void>((resolve, reject) => {
        mysqlProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`mysql process exited with code ${code}`));
          }
        });
        mysqlProcess.on("error", (err) => reject(err));
      });

      
      await notifyOwner({
        title: 'Restore Successful',
        content: `Database restored from backup ${backupId}`,
      });

      return true;
    } catch (error) {
      
      await notifyOwner({
        title: 'Restore Failed',
        content: `Failed to restore from backup ${backupId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      throw error;
    }
  }

  /**
   * Cleanup old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<number> {
    const now = Date.now();
    const retentionMs = this.config.retention * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [backupId, metadata] of this.backups.entries()) {
      if (now - metadata.timestamp > retentionMs) {
        try {
          const backupFile = join(this.config.destination, `${backupId}.sql`);
          if (existsSync(backupFile)) {
            // Ensure backupFile is within the designated backup directory before deletion
            if (!backupFile.startsWith(this.config.destination)) {
              throw new Error("Invalid backup file path for deletion");
            }
            await fsPromises.rm(backupFile);
          }
          this.backups.delete(backupId);
          deletedCount++;
                  } catch (error) {
                  }
      }
    }

    this.saveMetadata();
    
    return deletedCount;
  }

  /**
   * Get backup list
   */
  getBackups(limit = 50): BackupMetadata[] {
    return Array.from(this.backups.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get backup statistics
   */
  getStatistics() {
    const backups = Array.from(this.backups.values());
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const successCount = backups.filter((b) => b.status === 'success').length;
    const failedCount = backups.filter((b) => b.status === 'failed').length;

    return {
      totalBackups: backups.length,
      successCount,
      failedCount,
      totalSize,
      averageSize: backups.length > 0 ? totalSize / backups.length : 0,
      oldestBackup: backups.length > 0 ? Math.min(...backups.map((b) => b.timestamp)) : null,
      newestBackup: backups.length > 0 ? Math.max(...backups.map((b) => b.timestamp)) : null,
    };
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    const metadata = this.backups.get(backupId);
    if (!metadata) {
      throw new Error(`Backup ${backupId} not found`);
    }

    try {
      const backupFile = join(this.config.destination, `${backupId}.sql`);
      const checksumProcess = spawn("md5sum", [backupFile], { stdio: ["ignore", "pipe", "inherit"] });
      let checksumOutput = "";
      checksumProcess.stdout.on("data", (data) => (checksumOutput += data.toString()));
      await new Promise<void>((resolve, reject) => {
        checksumProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`md5sum process exited with code ${code}`));
          }
        });
        checksumProcess.on("error", (err) => reject(err));
      });
      const checksum = checksumOutput.split(" ")[0];

      const isValid = checksum.trim() === metadata.checksum;
      
      return isValid;
    } catch (error) {
            return false;
    }
  }
}

export const backupSystem = new BackupSystem();

// REST API routes
import { Router } from 'express';

export const backupRouter = Router();

/**
 * POST /backups - Create new backup
 */
backupRouter.post('/backups', async (req, res) => {
  try {
    const metadata = await backupSystem.createBackup();
    res.json({ success: true, backup: metadata });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /backups - List backups
 */
backupRouter.get('/backups', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const backups = backupSystem.getBackups(limit);
  res.json({ backups });
});

/**
 * GET /backups/stats - Get backup statistics
 */
backupRouter.get('/backups/stats', (req, res) => {
  const stats = backupSystem.getStatistics();
  res.json(stats);
});

/**
 * POST /backups/:id/restore - Restore from backup
 */
backupRouter.post('/backups/:id/restore', async (req, res) => {
  try {
    const success = await backupSystem.restoreBackup(req.params.id);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /backups/:id/verify - Verify backup integrity
 */
backupRouter.post('/backups/:id/verify', async (req, res) => {
  try {
    const isValid = await backupSystem.verifyBackup(req.params.id);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /backups/cleanup - Cleanup old backups
 */
backupRouter.post('/backups/cleanup', async (req, res) => {
  try {
    const deletedCount = await backupSystem.cleanupOldBackups();
    res.json({ success: true, deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default backupRouter;
