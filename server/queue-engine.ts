/**
 * QUEUE & JOB PROCESSING ENGINE
 * In-memory job queue with priority scheduling, retry logic,
 * dead letter queue, rate limiting, and observability.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "dead";
export type JobPriority = "low" | "normal" | "high" | "critical";

export interface Job<T = unknown> {
  id: string;
  queue: string;
  payload: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: unknown;
  scheduledFor?: Date;
  timeout: number; // ms
  tags: string[];
}

export interface QueueConfig {
  name: string;
  concurrency: number;
  maxRetries: number;
  retryDelay: number; // ms
  timeout: number; // ms
  rateLimitPerMinute?: number;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<unknown>;

export interface QueueStats {
  name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  dead: number;
  avgProcessingTime: number;
  throughput: number; // jobs/minute
}

// ═══════════════════════════════════════════════════════════════
// JOB QUEUE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

export class JobQueue {
  private queues: Map<string, QueueConfig> = new Map();
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Map<string, Set<string>> = new Map();
  private completionTimes: number[] = [];
  private idCounter = 0;
  private intervals: ReturnType<typeof setInterval>[] = [];

  constructor() {
    // Process queues every 100ms
    const interval = setInterval(() => this.processQueues(), 100);
    this.intervals.push(interval);
  }

  /**
   * Register a queue with configuration
   */
  registerQueue(config: QueueConfig): void {
    this.queues.set(config.name, config);
    this.processing.set(config.name, new Set());
  }

  /**
   * Register a handler for a queue
   */
  registerHandler<T>(queueName: string, handler: JobHandler<T>): void {
    this.handlers.set(queueName, handler as JobHandler);
  }

  /**
   * Add a job to a queue
   */
  addJob<T>(queueName: string, payload: T, options?: {
    priority?: JobPriority;
    scheduledFor?: Date;
    timeout?: number;
    maxAttempts?: number;
    tags?: string[];
  }): Job<T> {
    const config = this.queues.get(queueName);
    if (!config) throw new Error(`Queue "${queueName}" not registered`);

    this.idCounter++;
    const job: Job<T> = {
      id: `JOB-${Date.now()}-${this.idCounter.toString().padStart(6, "0")}`,
      queue: queueName,
      payload,
      priority: options?.priority || "normal",
      status: "pending",
      attempts: 0,
      maxAttempts: options?.maxAttempts || config.maxRetries,
      createdAt: new Date(),
      scheduledFor: options?.scheduledFor,
      timeout: options?.timeout || config.timeout,
      tags: options?.tags || [],
    };

    this.jobs.set(job.id, job as Job);
    return job;
  }

  /**
   * Add multiple jobs at once (batch)
   */
  addBatch<T>(queueName: string, payloads: T[], options?: {
    priority?: JobPriority;
    tags?: string[];
  }): Job<T>[] {
    return payloads.map(payload => this.addJob(queueName, payload, options));
  }

  /**
   * Get job by ID
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Cancel a pending job
   */
  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || job.status !== "pending") return false;
    job.status = "dead";
    return true;
  }

  /**
   * Retry a failed job
   */
  retryJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || (job.status !== "failed" && job.status !== "dead")) return false;
    job.status = "pending";
    job.attempts = 0;
    job.error = undefined;
    return true;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueName: string): QueueStats {
    const jobs = Array.from(this.jobs.values()).filter(j => j.queue === queueName);
    const processing = this.processing.get(queueName)?.size || 0;

    const recentCompletions = this.completionTimes.filter(
      t => t > Date.now() - 60000
    ).length;

    const completedJobs = jobs.filter(j => j.status === "completed" && j.startedAt && j.completedAt);
    const avgTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => sum + (j.completedAt!.getTime() - j.startedAt!.getTime()), 0) / completedJobs.length
      : 0;

    return {
      name: queueName,
      pending: jobs.filter(j => j.status === "pending").length,
      processing,
      completed: jobs.filter(j => j.status === "completed").length,
      failed: jobs.filter(j => j.status === "failed").length,
      dead: jobs.filter(j => j.status === "dead").length,
      avgProcessingTime: avgTime,
      throughput: recentCompletions,
    };
  }

  /**
   * Get all queue stats
   */
  getAllStats(): QueueStats[] {
    return Array.from(this.queues.keys()).map(name => this.getQueueStats(name));
  }

  /**
   * Get dead letter queue jobs
   */
  getDeadLetterJobs(queueName?: string): Job[] {
    return Array.from(this.jobs.values())
      .filter(j => j.status === "dead" && (!queueName || j.queue === queueName));
  }

  /**
   * Purge completed jobs older than threshold
   */
  purgeCompleted(olderThanMs: number = 3600000): number {
    const cutoff = Date.now() - olderThanMs;
    let purged = 0;

    for (const [id, job] of Array.from(this.jobs.entries())) {
      if (job.status === "completed" && job.completedAt && job.completedAt.getTime() < cutoff) {
        this.jobs.delete(id);
        purged++;
      }
    }

    return purged;
  }

  /**
   * Shutdown the queue processor
   */
  shutdown(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
  }

  // ─── Private Processing Loop ─────────────────────────────────

  private async processQueues(): Promise<void> {
    for (const [queueName, config] of Array.from(this.queues.entries())) {
      const processingSet = this.processing.get(queueName)!;
      if (processingSet.size >= config.concurrency) continue;

      const handler = this.handlers.get(queueName);
      if (!handler) continue;

      // Get next job (priority-sorted)
      const nextJob = this.getNextJob(queueName);
      if (!nextJob) continue;

      // Check rate limit
      if (config.rateLimitPerMinute) {
        const recentCount = Array.from(this.jobs.values())
          .filter(j => j.queue === queueName && j.startedAt && j.startedAt.getTime() > Date.now() - 60000)
          .length;
        if (recentCount >= config.rateLimitPerMinute) continue;
      }

      // Process the job
      processingSet.add(nextJob.id);
      nextJob.status = "processing";
      nextJob.startedAt = new Date();
      nextJob.attempts++;

      this.executeJob(nextJob, handler, config, processingSet);
    }
  }

  private async executeJob(
    job: Job,
    handler: JobHandler,
    config: QueueConfig,
    processingSet: Set<string>
  ): Promise<void> {
    try {
      // Timeout wrapper
      const result = await Promise.race([
        handler(job),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Job timeout")), job.timeout)
        ),
      ]);

      job.status = "completed";
      job.completedAt = new Date();
      job.result = result;
      this.completionTimes.push(Date.now());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      job.error = errorMessage;

      if (job.attempts >= job.maxAttempts) {
        job.status = "dead";
        job.failedAt = new Date();
      } else {
        job.status = "failed";
        job.failedAt = new Date();
        // Schedule retry with exponential backoff
        const delay = config.retryDelay * Math.pow(2, job.attempts - 1);
        job.scheduledFor = new Date(Date.now() + delay);
        job.status = "pending";
      }
    } finally {
      processingSet.delete(job.id);
    }
  }

  private getNextJob(queueName: string): Job | undefined {
    const priorityOrder: JobPriority[] = ["critical", "high", "normal", "low"];
    const now = new Date();

    for (const priority of priorityOrder) {
      const job = Array.from(this.jobs.values()).find(j =>
        j.queue === queueName &&
        j.status === "pending" &&
        j.priority === priority &&
        (!j.scheduledFor || j.scheduledFor <= now)
      );
      if (job) return job;
    }

    return undefined;
  }
}

// ═══════════════════════════════════════════════════════════════
// CRON SCHEDULER
// ═══════════════════════════════════════════════════════════════

export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  lastRun?: Date;
  nextRun: Date;
  isActive: boolean;
  runCount: number;
  failCount: number;
}

export class CronScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private interval: ReturnType<typeof setInterval> | null = null;
  private taskIdCounter = 0;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 1000);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Register a scheduled task
   */
  register(name: string, cronExpression: string, handler: () => Promise<void>): string {
    this.taskIdCounter++;
    const id = `CRON-${this.taskIdCounter.toString().padStart(4, "0")}`;
    const task: ScheduledTask = {
      id,
      name,
      cronExpression,
      handler,
      nextRun: this.calculateNextRun(cronExpression),
      isActive: true,
      runCount: 0,
      failCount: 0,
    };
    this.tasks.set(id, task);
    return id;
  }

  /**
   * Unregister a task
   */
  unregister(id: string): boolean {
    return this.tasks.delete(id);
  }

  /**
   * Pause a task
   */
  pause(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    task.isActive = false;
    return true;
  }

  /**
   * Resume a task
   */
  resume(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    task.isActive = true;
    task.nextRun = this.calculateNextRun(task.cronExpression);
    return true;
  }

  /**
   * Get all tasks
   */
  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values()).map(t => ({
      ...t,
      handler: t.handler, // Keep reference
    }));
  }

  /**
   * Get task stats
   */
  getStats(): {
    totalTasks: number;
    activeTasks: number;
    totalRuns: number;
    totalFailures: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.isActive).length,
      totalRuns: tasks.reduce((sum, t) => sum + t.runCount, 0),
      totalFailures: tasks.reduce((sum, t) => sum + t.failCount, 0),
    };
  }

  // ─── Private ─────────────────────────────────────────────────

  private async tick(): Promise<void> {
    const now = new Date();

    for (const task of Array.from(this.tasks.values())) {
      if (!task.isActive) continue;
      if (task.nextRun > now) continue;

      // Execute task
      task.lastRun = now;
      task.runCount++;

      try {
        await task.handler();
      } catch {
        task.failCount++;
      }

      // Schedule next run
      task.nextRun = this.calculateNextRun(task.cronExpression);
    }
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simplified cron parser (supports: every Xm, every Xh, every Xd)
    const match = cronExpression.match(/every\s+(\d+)(m|h|d)/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      const ms = unit === "m" ? value * 60000 : unit === "h" ? value * 3600000 : value * 86400000;
      return new Date(Date.now() + ms);
    }
    // Default: every hour
    return new Date(Date.now() + 3600000);
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETONS
// ═══════════════════════════════════════════════════════════════

let jobQueueInstance: JobQueue | null = null;
let cronSchedulerInstance: CronScheduler | null = null;

export function getJobQueue(): JobQueue {
  if (!jobQueueInstance) {
    jobQueueInstance = new JobQueue();

    // Register default queues
    jobQueueInstance.registerQueue({
      name: "notifications",
      concurrency: 5,
      maxRetries: 3,
      retryDelay: 5000,
      timeout: 10000,
      rateLimitPerMinute: 100,
    });

    jobQueueInstance.registerQueue({
      name: "media_processing",
      concurrency: 2,
      maxRetries: 2,
      retryDelay: 30000,
      timeout: 120000,
    });

    jobQueueInstance.registerQueue({
      name: "ai_analysis",
      concurrency: 3,
      maxRetries: 2,
      retryDelay: 10000,
      timeout: 60000,
      rateLimitPerMinute: 30,
    });

    jobQueueInstance.registerQueue({
      name: "payouts",
      concurrency: 1,
      maxRetries: 5,
      retryDelay: 60000,
      timeout: 30000,
    });

    jobQueueInstance.registerQueue({
      name: "indexing",
      concurrency: 3,
      maxRetries: 2,
      retryDelay: 5000,
      timeout: 30000,
      rateLimitPerMinute: 60,
    });
  }
  return jobQueueInstance;
}

export function getCronScheduler(): CronScheduler {
  if (!cronSchedulerInstance) {
    cronSchedulerInstance = new CronScheduler();
  }
  return cronSchedulerInstance;
}
