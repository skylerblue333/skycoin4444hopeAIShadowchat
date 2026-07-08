import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from './db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationLog {
  id: string;
  name: string;
  executedAt: Date;
  duration: number;
  status: 'success' | 'failed';
  error?: string;
}

class MigrationManager {
  private migrationsDir = path.join(__dirname, '../drizzle/migrations');
  private migrationLogs: MigrationLog[] = [];

  /**
   * Run all pending migrations
   */
  async runMigrations() {
        const startTime = Date.now();

    try {
      // Run Drizzle migrations
      await migrate(db, {
        migrationsFolder: this.migrationsDir,
      });

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        duration,
        message: 'All migrations applied successfully',
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get list of pending migrations
   */
  async getPendingMigrations(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));
      return sqlFiles;
    } catch (error) {
            return [];
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(): Promise<MigrationLog[]> {
    return this.migrationLogs;
  }

  /**
   * Validate migration files
   */
  async validateMigrations(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const files = fs.readdirSync(this.migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));

      for (const file of sqlFiles) {
        const filePath = path.join(this.migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Validate SQL syntax
        if (!content.trim()) {
          errors.push(`${file}: Empty migration file`);
        }

        // Check for dangerous operations without safeguards
        if (content.includes('DROP TABLE') && !content.includes('IF EXISTS')) {
          errors.push(`${file}: DROP TABLE without IF EXISTS`);
        }

        if (content.includes('DELETE FROM') && !content.includes('WHERE')) {
          errors.push(`${file}: DELETE without WHERE clause`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Error validating migrations: ${error}`],
      };
    }
  }

  /**
   * Generate migration report
   */
  async generateMigrationReport() {
    const pending = await this.getPendingMigrations();
    const validation = await this.validateMigrations();

    const report = {
      timestamp: new Date().toISOString(),
      pendingMigrations: pending,
      migrationCount: pending.length,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
      },
      history: this.migrationLogs,
    };

    return report;
  }

  /**
   * Rollback to specific migration
   */
  async rollbackToMigration(migrationName: string) {
            // This would require custom rollback logic based on your migration strategy
  }

  /**
   * Create new migration file
   */
  async createMigration(name: string, sql: string) {
    const timestamp = Date.now();
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationsDir, filename);

    try {
      fs.writeFileSync(filepath, sql);
            return filename;
    } catch (error) {
            throw error;
    }
  }
}

// Export singleton instance
export const migrationManager = new MigrationManager();

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'run':
      migrationManager
        .runMigrations()
        .then((result) => {
          console.log(`Migrations run result: ${JSON.stringify(result)}`);
          process.exit(0);
        })
        .catch((error) => {
                    process.exit(1);
        });
      break;

    case 'pending':
      migrationManager
        .getPendingMigrations()
        .then((migrations) => {
          console.log(`Pending migrations: ${migrations.join(', ')}`);
          process.exit(0);
        })
        .catch((error) => {
                    process.exit(1);
        });
      break;

    case 'validate':
      migrationManager
        .validateMigrations()
        .then((result) => {
          console.log(`Migration validation result: ${JSON.stringify(result)}`);
          process.exit(result.valid ? 0 : 1);
        })
        .catch((error) => {
                    process.exit(1);
        });
      break;

    case 'report':
      migrationManager
        .generateMigrationReport()
        .then((report) => {
          console.log(`Migration report: ${JSON.stringify(report, null, 2)}`);
          process.exit(0);
        })
        .catch((error) => {
                    process.exit(1);
        });
      break;

    default:
      console.log(`Unknown command: ${command}`);
      process.exit(1);
  }
}
