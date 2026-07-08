import crypto from 'crypto';
/**
 * @file titan-orchestrator-engine.ts
 * @description TITAN Orchestrator Engine for SKYCOIN4444 platform.
 *              Manages job queues, workflow orchestration, distributed task execution,
 *              and advanced scheduling features.
 * @author Skyler blue <skyler.blue@example.com>
 * @date 2026-06-18
 */

import { invokeLLM } from "./_core/llm";

// --- Types and Interfaces ---

/**
 * Represents the status of a task or workflow.
 */
export enum TaskStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
  CANCELLED = "CANCELLED",
  PAUSED = "PAUSED",
}

/**
 * Defines the priority level for a task.
 */
export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Represents a single task within a workflow.
 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retriesAttempted: number;
  maxRetries: number;
  dependencies: string[]; // Task IDs that this task depends on
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  workerId?: string;
}

/**
 * Represents a scheduled job.
 */
export interface ScheduledJob {
  id: string;
  name: string;
  cronSchedule: string;
  taskId: string;
  lastRunAt?: number;
  nextRunAt: number;
  enabled: boolean;
}

/**
 * Represents a workflow definition.
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  tasks: Task[]; // List of tasks in the workflow
  startTaskIds: string[]; // IDs of tasks that can start the workflow
}

/**
 * Represents an instance of a running workflow.
 */
export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  taskStates: Map<string, TaskStatus>; // Current status of each task in the workflow
  currentTasks: string[]; // IDs of tasks currently being processed
  failedTasks: string[]; // IDs of tasks that have failed
}

/**
 * Configuration for retry policies.
 */
export interface RetryPolicy {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

/**
 * Represents an entry in the dead letter queue.
 */
export interface DeadLetterQueueEntry {
  id: string;
  originalTaskId: string;
  reason: string;
  timestamp: number;
  taskPayload: Record<string, any>;
}

/**
 * Represents a worker capable of executing tasks.
 */
export interface Worker {
  id: string;
  status: 'IDLE' | 'BUSY' | 'OFFLINE';
  lastHeartbeat: number;
  capabilities: string[]; // e.g., ['data-processing', 'api-calls']
  currentTaskId?: string;
}

/**
 * Represents a task monitoring record.
 */
export interface TaskMonitorRecord {
  taskId: string;
  workflowId?: string;
  metric: string;
  value: number;
  timestamp: number;
}

// --- Constants ---

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
};

const MAX_WORKER_POOL_SIZE = 100;
const DEFAULT_TASK_TIMEOUT_MS = 60000;
const CRON_CHECK_INTERVAL_MS = 5000;

// --- Utility Functions ---

function generateUniqueId(): string {
  return `task-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`;
}

function parseCronSchedule(cron: string): number {
  // This is a simplified placeholder. A real implementation would use a cron library.
  // For now, let's assume a simple interval for demonstration.
  // e.g., "* * * * *" -> every minute
  // "0 0 * * *" -> daily at midnight
  // For this example, we'll just return a placeholder for next run time.
  const now = Date.now();
  if (cron === "* * * * *") {
    return now + 60 * 1000; // Every minute
  } else if (cron === "0 0 * * *") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
  return now + 5 * 60 * 1000; // Default to 5 minutes for unknown cron patterns
}

// --- Main Engine Class ---

export class TitanOrchestratorEngine {
  private static instance: TitanOrchestratorEngine;
  private taskQueue: Task[] = [];
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private workflowDefinitions: Map<string, WorkflowDefinition> = new Map();
  private workflowInstances: Map<string, WorkflowInstance> = new Map();
  private workers: Map<string, Worker> = new Map();
  private deadLetterQueue: DeadLetterQueueEntry[] = [];
  private taskMonitors: Map<string, TaskMonitorRecord[]> = new Map();
  private workerPoolSize: number = MAX_WORKER_POOL_SIZE;
  private cronSchedulerInterval: NodeJS.Timeout | null = null;

  private constructor() {
        this.startCronScheduler();
  }

  public static getInstance(): TitanOrchestratorEngine {
    if (!TitanOrchestratorEngine.instance) {
      TitanOrchestratorEngine.instance = new TitanOrchestratorEngine();
    }
    return TitanOrchestratorEngine.instance;
  }

  // --- Job Queue Management ---

  /**
   * Adds a task to the job queue.
   * @param task The task to add.
   * @returns The added task.
   */
  public addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'retriesAttempted'>): Task {
    const newTask: Task = {
      ...task,
      id: generateUniqueId(),
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      retriesAttempted: 0,
      dependencies: task.dependencies || [],
    };
    this.taskQueue.push(newTask);
    this.sortTaskQueue();
        this.assignTasksToWorkers();
    return newTask;
  }

  /**
   * Retrieves a task by its ID.
   * @param taskId The ID of the task.
   * @returns The task if found, otherwise undefined.
   */
  public getTask(taskId: string): Task | undefined {
    return this.taskQueue.find(task => task.id === taskId) ||
           Array.from(this.workflowInstances.values()).flatMap(wi => Array.from(wi.taskStates.keys()))
             .map(id => this.getTaskFromWorkflow(id))
             .find(task => task?.id === taskId);
  }

  /**
   * Updates the status of a task.
   * @param taskId The ID of the task to update.
   * @param status The new status.
   * @param result Optional result payload.
   * @param error Optional error message.
   * @returns True if the task was updated, false otherwise.
   */
  public updateTaskStatus(taskId: string, status: TaskStatus, result?: Record<string, any>, error?: string): boolean {
    const task = this.taskQueue.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (result) task.result = result;
      if (error) task.error = error;
      if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED || status === TaskStatus.CANCELLED) {
        task.completedAt = Date.now();
      }
            this.processWorkflowDependencies(taskId, status);
      return true;
    }
    return false;
  }

  /**
   * Sorts the task queue by priority (highest first) and then by creation time (oldest first).
   */
  private sortTaskQueue(): void {
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.createdAt - b.createdAt; // Older tasks first for same priority
    });
  }

  // --- Workflow Orchestration ---

  /**
   * Defines a new workflow.
   * @param definition The workflow definition.
   * @returns The defined workflow.
   */
  public defineWorkflow(definition: Omit<WorkflowDefinition, 'id'>): WorkflowDefinition {
    const newDefinition: WorkflowDefinition = {
      ...definition,
      id: generateUniqueId(),
    };
    this.workflowDefinitions.set(newDefinition.id, newDefinition);
    console.log(`Workflow ${newDefinition.name} defined with ID ${newDefinition.id}`);
    return newDefinition;
  }

  /**
   * Starts a new instance of a defined workflow.
   * @param workflowDefinitionId The ID of the workflow definition.
   * @returns The new workflow instance, or undefined if definition not found.
   */
  public startWorkflow(workflowDefinitionId: string): WorkflowInstance | undefined {
    const definition = this.workflowDefinitions.get(workflowDefinitionId);
    if (!definition) {
            return undefined;
    }

    const instanceId = generateUniqueId();
    const taskStates = new Map<string, TaskStatus>();
    definition.tasks.forEach(task => taskStates.set(task.id, TaskStatus.PENDING));

    const newInstance: WorkflowInstance = {
      id: instanceId,
      definitionId: workflowDefinitionId,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      taskStates: taskStates,
      currentTasks: [],
      failedTasks: [],
    };
    this.workflowInstances.set(instanceId, newInstance);

    // Add initial tasks to the main task queue if they have no dependencies
    definition.startTaskIds.forEach(taskId => {
      const task = definition.tasks.find(t => t.id === taskId);
      if (task && task.dependencies.length === 0) {
        const { status: _s, id: _id, createdAt: _ca, retriesAttempted: _ra, ...taskData } = task;
        this.addTask(taskData);
        newInstance.taskStates.set(taskId, TaskStatus.RUNNING);
        newInstance.currentTasks.push(taskId);
      }
    });

    newInstance.status = TaskStatus.RUNNING;
    newInstance.startedAt = Date.now();
        return newInstance;
  }

  /**
   * Processes task completion within a workflow, checking dependencies.
   * @param completedTaskId The ID of the task that just completed.
   * @param status The final status of the completed task.
   */
  private processWorkflowDependencies(completedTaskId: string, status: TaskStatus): void {
    this.workflowInstances.forEach(instance => {
      if (instance.taskStates.has(completedTaskId)) {
        instance.taskStates.set(completedTaskId, status);
        instance.currentTasks = instance.currentTasks.filter(id => id !== completedTaskId);

        if (status === TaskStatus.FAILED) {
          instance.failedTasks.push(completedTaskId);
          instance.status = TaskStatus.FAILED; // Mark workflow as failed if any task fails
                    return;
        }

        const definition = this.workflowDefinitions.get(instance.definitionId);
        if (!definition) return;

        // Find tasks that depend on the completed task
        const dependentTasks = definition.tasks.filter(task =>
          task.dependencies.includes(completedTaskId)
        );

        dependentTasks.forEach(dependentTask => {
          // Check if all dependencies for the dependent task are met
          const allDependenciesMet = dependentTask.dependencies.every(depId =>
            instance.taskStates.get(depId) === TaskStatus.COMPLETED
          );

          if (allDependenciesMet && instance.taskStates.get(dependentTask.id) === TaskStatus.PENDING) {
            const { status: _ds, id: _did, createdAt: _dca, retriesAttempted: _dra, ...depTaskData } = dependentTask;
            this.addTask(depTaskData);
            instance.taskStates.set(dependentTask.id, TaskStatus.RUNNING);
            instance.currentTasks.push(dependentTask.id);
                      }
        });

        // Check if workflow is complete
        const allTasksCompleted = definition.tasks.every(task =>
          instance.taskStates.get(task.id) === TaskStatus.COMPLETED
        );

        if (allTasksCompleted) {
          instance.status = TaskStatus.COMPLETED;
          instance.completedAt = Date.now();
                  }
      }
    });
  }

  private getTaskFromWorkflow(taskId: string): Task | undefined {
    for (const definition of this.workflowDefinitions.values()) {
      const task = definition.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  }

  // --- Cron Scheduling ---

  /**
   * Schedules a new job to run at specified cron intervals.
   * @param job The job to schedule.
   * @returns The scheduled job.
   */
  public scheduleJob(job: Omit<ScheduledJob, 'id' | 'nextRunAt'>): ScheduledJob {
    const newJob: ScheduledJob = {
      ...job,
      id: generateUniqueId(),
      nextRunAt: parseCronSchedule(job.cronSchedule),
    };
    this.scheduledJobs.set(newJob.id, newJob);
    console.log(`Scheduled job ${newJob.name} with ID ${newJob.id} to run at ${new Date(newJob.nextRunAt).toISOString()}`);
    return newJob;
  }

  /**
   * Starts the cron scheduler to periodically check and trigger scheduled jobs.
   */
  private startCronScheduler(): void {
    if (this.cronSchedulerInterval) {
      clearInterval(this.cronSchedulerInterval);
    }
    this.cronSchedulerInterval = setInterval(() => this.checkScheduledJobs(), CRON_CHECK_INTERVAL_MS);
  }

  /**
   * Checks for scheduled jobs that are due to run and adds them to the task queue.
   */
  private checkScheduledJobs(): void {
    const now = Date.now();
    this.scheduledJobs.forEach(job => {
      if (job.enabled && job.nextRunAt <= now) {
        console.log(`Scheduled job ${job.name} is due to run. Triggering task ${job.taskId}`);
        // Assuming the taskId in ScheduledJob refers to a predefined task or workflow
        const taskDefinition = this.getTaskFromWorkflow(job.taskId);
        if (taskDefinition) {
          const { status: _ts, id: _tid, createdAt: _tca, retriesAttempted: _tra, ...taskDefData } = taskDefinition;
          this.addTask(taskDefData);
        } else {
          console.warn(`Task definition for scheduled job ${job.name} not found: ${job.taskId}`);
        }
        job.lastRunAt = now;
        job.nextRunAt = parseCronSchedule(job.cronSchedule);
        this.scheduledJobs.set(job.id, job);
      }
    });
  }

  // --- Distributed Task Execution (Simplified) ---

  /**
   * Registers a worker with the orchestrator.
   * @param workerId The ID of the worker.
   * @param capabilities The capabilities of the worker.
   * @returns The registered worker.
   */
  public registerWorker(workerId: string, capabilities: string[]): Worker {
    const newWorker: Worker = {
      id: workerId,
      status: 'IDLE',
      lastHeartbeat: Date.now(),
      capabilities: capabilities,
    };
    this.workers.set(workerId, newWorker);
    this.assignTasksToWorkers();
    console.log(`Worker ${newWorker.id} registered with capabilities: ${newWorker.capabilities.join(", ")}`);
    return newWorker;
  }

  /**
   * Updates a worker's status and heartbeat.
   * @param workerId The ID of the worker.
   * @param status The new status.
   * @param currentTaskId Optional ID of the task the worker is currently executing.
   * @returns True if updated, false otherwise.
   */
  public updateWorkerStatus(workerId: string, status: 'IDLE' | 'BUSY' | 'OFFLINE', currentTaskId?: string): boolean {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = status;
      worker.lastHeartbeat = Date.now();
      worker.currentTaskId = currentTaskId;
      this.workers.set(workerId, worker);
            return true;
    }
    return false;
  }

  /**
   * Assigns pending tasks to available workers.
   */
  private assignTasksToWorkers(): void {
    const availableWorkers = Array.from(this.workers.values()).filter(w => w.status === 'IDLE');
    if (availableWorkers.length === 0 || this.taskQueue.length === 0) {
      return;
    }

    for (const worker of availableWorkers) {
      const taskIndex = this.taskQueue.findIndex(task =>
        task.status === TaskStatus.PENDING &&
        worker.capabilities.some(cap => task.payload.requiredCapabilities?.includes(cap) || true) // Simplified capability matching
      );

      if (taskIndex !== -1) {
        const task = this.taskQueue[taskIndex];
        this.taskQueue.splice(taskIndex, 1); // Remove from queue

        task.status = TaskStatus.RUNNING;
        task.startedAt = Date.now();
        task.workerId = worker.id;
        worker.status = 'BUSY';
        worker.currentTaskId = task.id;
        this.workers.set(worker.id, worker);

        // In a real system, this would send the task to the worker for execution.
        // For this simulation, we'll just log and assume execution happens.
                // Simulate task completion/failure after a delay
        setTimeout(() => this.simulateTaskExecution(task), DEFAULT_TASK_TIMEOUT_MS / 2);
      } else {
        break; // No more suitable tasks for this worker
      }
    }
  }

  /**
   * Simulates task execution by a worker.
   * In a real scenario, this would involve actual worker communication.
   * @param task The task to simulate execution for.
   */
  private simulateTaskExecution(task: Task): void {
    const success = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) > 0.2; // 80% success rate
    if (success) {
      this.updateTaskStatus(task.id, TaskStatus.COMPLETED, { simulatedResult: `Task ${task.id} completed.` });
    } else {
      this.handleTaskFailure(task, 'Simulated execution failure.');
    }
    if (task.workerId) {
      this.updateWorkerStatus(task.workerId, 'IDLE');
      this.assignTasksToWorkers(); // Try to assign new tasks after one completes
    }
  }

  // --- Dependency Resolution (handled within workflow orchestration) ---

  // --- Retry Policies ---

  /**
   * Handles a task failure, applying retry policies or moving to DLQ.
   * @param task The failed task.
   * @param errorMessage The error message.
   */
  private handleTaskFailure(task: Task, errorMessage: string): void {
    task.retriesAttempted++;
    const retryPolicy = DEFAULT_RETRY_POLICY; // Could be task-specific

    if (task.retriesAttempted <= retryPolicy.maxAttempts) {
      const delay = retryPolicy.delayMs * Math.pow(retryPolicy.backoffFactor, task.retriesAttempted - 1);
  
      this.updateTaskStatus(task.id, TaskStatus.RETRYING, undefined, errorMessage);
      setTimeout(() => {
        task.status = TaskStatus.PENDING; // Re-add to queue for retry
        this.taskQueue.push(task);
        this.sortTaskQueue();
        this.assignTasksToWorkers();
      }, delay);
    } else {
            this.moveToDeadLetterQueue(task, errorMessage);
      this.updateTaskStatus(task.id, TaskStatus.FAILED, undefined, errorMessage);
    }
  }

  // --- Dead Letter Queues ---

  /**
   * Moves a failed task to the Dead Letter Queue.
   * @param task The task to move.
   * @param reason The reason for moving to DLQ.
   */
  private moveToDeadLetterQueue(task: Task, reason: string): void {
    const dlqEntry: DeadLetterQueueEntry = {
      id: generateUniqueId(),
      originalTaskId: task.id,
      reason: reason,
      timestamp: Date.now(),
      taskPayload: task.payload,
    };
    this.deadLetterQueue.push(dlqEntry);
  }

  /**
   * Retrieves all entries from the Dead Letter Queue.
   * @returns An array of DeadLetterQueueEntry.
   */
  public getDeadLetterQueueEntries(): DeadLetterQueueEntry[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Removes an entry from the Dead Letter Queue.
   * @param entryId The ID of the DLQ entry to remove.
   * @returns True if removed, false otherwise.
   */
  public removeDeadLetterQueueEntry(entryId: string): boolean {
    const initialLength = this.deadLetterQueue.length;
    this.deadLetterQueue = this.deadLetterQueue.filter(entry => entry.id !== entryId);
    return this.deadLetterQueue.length < initialLength;
  }

  // --- Task Prioritization (handled by sortTaskQueue) ---

  // --- Worker Pool Management ---

  /**
   * Sets the maximum size of the worker pool.
   * @param size The new maximum size.
   */
  public setWorkerPoolSize(size: number): void {
    if (size > 0) {
      this.workerPoolSize = size;
          } else {
          }
  }

  /**
   * Gets the current worker pool status.
   * @returns An array of current workers.
   */
  public getWorkerPoolStatus(): Worker[] {
    return Array.from(this.workers.values());
  }

  // --- Task Monitoring ---

  /**
   * Records a monitoring metric for a task.
   * @param record The monitoring record.
   */
  public recordTaskMetric(record: TaskMonitorRecord): void {
    if (!this.taskMonitors.has(record.taskId)) {
      this.taskMonitors.set(record.taskId, []);
    }
    this.taskMonitors.get(record.taskId)?.push(record);
      }

  /**
   * Retrieves monitoring records for a specific task.
   * @param taskId The ID of the task.
   * @returns An array of TaskMonitorRecord.
   */
  public getTaskMonitoringRecords(taskId: string): TaskMonitorRecord[] {
    return this.taskMonitors.get(taskId) || [];
  }

  // --- Workflow Templates (Simplified via WorkflowDefinition) ---

  /**
   * Retrieves a workflow definition by its ID.
   * @param definitionId The ID of the workflow definition.
   * @returns The workflow definition if found, otherwise undefined.
   */
  public getWorkflowDefinition(definitionId: string): WorkflowDefinition | undefined {
    return this.workflowDefinitions.get(definitionId);
  }

  /**
   * Retrieves a workflow instance by its ID.
   * @param instanceId The ID of the workflow instance.
   * @returns The workflow instance if found, otherwise undefined.
   */
  public getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.workflowInstances.get(instanceId);
  }

  /**
   * Uses LLM to suggest workflow improvements or task optimizations.
   * @param prompt The prompt for the LLM.
   * @returns A promise that resolves to the LLM's response.
   */
  public async suggestWorkflowImprovements(prompt: string): Promise<string> {
    try {
      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      return String(response.choices[0]?.message?.content || "");
    } catch (error) {
      return `Error suggesting improvements: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Cleans up resources when the engine is stopped.
   */
  public stop(): void {
    if (this.cronSchedulerInterval) {
      clearInterval(this.cronSchedulerInterval);
      this.cronSchedulerInterval = null;
    }
}

// --- Singleton Export ---
export const titanOrchestratorEngine = TitanOrchestratorEngine.getInstance();
}
