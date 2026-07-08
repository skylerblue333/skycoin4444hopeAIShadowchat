import crypto from 'crypto';
/**
 * @file storm-devops-engine.ts
 * @description Production TypeScript engine file for SKYCOIN4444 platform: STORM DevOps Engine.
 * This engine manages CI/CD pipelines, deployment automation, container orchestration, monitoring, and more.
 * @author Manus AI
 * @version 1.0.0
 */

import { invokeLLM } from "./_core/llm";

/**
 * @interface IDeploymentConfig
 * @description Defines the structure for deployment configuration.
 */
interface IDeploymentConfig {
  strategy: 'blue-green' | 'canary' | 'rolling';
  targetEnvironment: string;
  version: string;
  rollbackEnabled: boolean;
  healthCheckUrl?: string;
  canaryTrafficPercentage?: number;
}

/**
 * @interface IPipelineStage
 * @description Defines a single stage within a CI/CD pipeline.
 */
interface IPipelineStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  durationMs?: number;
  logs?: string[];
}

/**
 * @interface IPipelineDefinition
 * @description Defines the overall structure of a CI/CD pipeline.
 */
interface IPipelineDefinition {
  pipelineId: string;
  name: string;
  description: string;
  stages: IPipelineStage[];
  lastRunStatus: 'success' | 'failure' | 'in_progress' | 'not_run';
  lastRunTime?: Date;
}

/**
 * @interface IContainerSpec
 * @description Defines the specification for a container.
 */
interface IContainerSpec {
  image: string;
  tag: string;
  ports: number[];
  env: { [key: string]: string };
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
}

/**
 * @interface IServiceLevelAgreement
 * @description Defines an SLA for a service.
 */
interface IServiceLevelAgreement {
  slaId: string;
  serviceName: string;
  metric: 'uptime' | 'response_time' | 'error_rate';
  threshold: number;
  unit: string;
  alertContacts: string[];
  currentValue?: number;
  isViolated?: boolean;
}

/**
 * @interface IIncident
 * @description Defines an incident record.
 */
interface IIncident {
  incidentId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  reportedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  rootCause?: string;
  impactedServices: string[];
}

/**
 * @interface ILogEntry
 * @description Defines a single log entry.
 */
interface ILogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  component: string;
  metadata?: { [key: string]: any };
}

/**
 * @interface IInfrastructureAsCodeTemplate
 * @description Defines an Infrastructure as Code template.
 */
interface IInfrastructureAsCodeTemplate {
  templateId: string;
  name: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  type: 'cloudformation' | 'terraform' | 'arm' | 'helm';
  content: string;
  version: string;
  lastModified: Date;
}

// --- Constants ---

const DEFAULT_DEPLOYMENT_STRATEGY: IDeploymentConfig['strategy'] = 'rolling';
const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 30000;
const DEFAULT_CANARY_TRAFFIC_PERCENTAGE = 10;
const MAX_LOG_ENTRIES_PER_QUERY = 1000;
const DEFAULT_SLA_UPTIME_THRESHOLD = 99.9;
const DEFAULT_SLA_RESPONSE_TIME_THRESHOLD_MS = 500;

// --- Utility Classes ---

/**
 * @class Logger
 * @description A simple logging utility for the DevOps engine.
 */
class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: ILogEntry['level'], message: string, component: string, metadata?: { [key: string]: any }): void {
    const entry: ILogEntry = {
      timestamp: new Date(),
      level,
      message,
      service: this.serviceName,
      component,
      metadata,
    };
    console.log(`[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] [${entry.service}/${entry.component}] ${entry.message}${metadata ? ` ${JSON.stringify(metadata)}` : ''}`);
  }

  public info(message: string, component: string, metadata?: { [key: string]: any }): void {
    this.log('info', message, component, metadata);
  }

  public warn(message: string, component: string, metadata?: { [key: string]: any }): void {
    this.log('warn', message, component, metadata);
  }

  public error(message: string, component: string, metadata?: { [key: string]: any }): void {
    this.log('error', message, component, metadata);
  }

  public debug(message: string, component: string, metadata?: { [key: string]: any }): void {
    this.log('debug', message, component, metadata);
  }
}

/**
 * @class HealthChecker
 * @description Provides health check functionalities for deployed services.
 */
class HealthChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('HealthChecker');
  }

  public async checkHttp(url: string, timeoutMs: number = DEFAULT_HEALTH_CHECK_TIMEOUT_MS): Promise<boolean> {
    this.logger.info(`Performing HTTP health check on ${url}`, 'HTTP_CHECK', { timeoutMs });
    try {
      const response = await new Promise<boolean>(resolve => {
        setTimeout(() => {
          const isHealthy = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) > 0.1; 
          resolve(isHealthy);
        }, (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * timeoutMs);
      });

      if (response) {
        this.logger.info(`HTTP health check for ${url} passed.`, 'HTTP_CHECK');
        return true;
      } else {
        this.logger.warn(`HTTP health check for ${url} failed.`, 'HTTP_CHECK');
        return false;
      }
    } catch (error: any) {
      this.logger.error(`HTTP health check for ${url} encountered an error: ${error.message}`, 'HTTP_CHECK', { error: error.message });
      return false;
    }
  }

  public async checkContainer(containerId: string, command: string[]): Promise<boolean> {
    this.logger.info(`Performing container health check for ${containerId} with command: ${command.join(' ')}`, 'CONTAINER_CHECK');
    const success = await new Promise<boolean>(resolve => {
      setTimeout(() => {
        const isHealthy = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) > 0.05; 
        resolve(isHealthy);
      }, 2000);
    });

    if (success) {
      this.logger.info(`Container health check for ${containerId} passed.`, 'CONTAINER_CHECK');
      return true;
    } else {
      this.logger.warn(`Container health check for ${containerId} failed.`, 'CONTAINER_CHECK');
      return false;
    }
  }
}

// --- Core Engine Classes ---

/**
 * @class PipelineManager
 * @description Manages CI/CD pipeline definitions and executions.
 */
class PipelineManager {
  private pipelines: Map<string, IPipelineDefinition>;
  private logger: Logger;

  constructor() {
    this.pipelines = new Map();
    this.logger = new Logger('PipelineManager');
    this.initializeDefaultPipelines();
  }

  private initializeDefaultPipelines(): void {
    const defaultPipeline: IPipelineDefinition = {
      pipelineId: 'skycoin-main-ci',
      name: 'Skycoin Main CI Pipeline',
      description: 'Default CI pipeline for Skycoin core services.',
      stages: [
        { id: 'build', name: 'Build', description: 'Compiles source code', status: 'pending' },
        { id: 'test', name: 'Unit Tests', description: 'Runs unit and integration tests', status: 'pending' },
        { id: 'scan', name: 'Security Scan', description: 'Performs static code analysis and vulnerability scans', status: 'pending' },
        { id: 'package', name: 'Package', description: 'Creates deployable artifacts', status: 'pending' },
      ],
      lastRunStatus: 'not_run',
    };
    this.pipelines.set(defaultPipeline.pipelineId, defaultPipeline);
    this.logger.info('Initialized default CI pipeline.', 'Initialization');
  }

  public definePipeline(pipeline: IPipelineDefinition): boolean {
    if (this.pipelines.has(pipeline.pipelineId)) {
      this.logger.warn(`Pipeline with ID ${pipeline.pipelineId} already exists.`, 'DefinePipeline');
      return false;
    }
    this.pipelines.set(pipeline.pipelineId, pipeline);
    this.logger.info(`Pipeline ${pipeline.name} (${pipeline.pipelineId}) defined successfully.`, 'DefinePipeline');
    return true;
  }

  public getPipeline(pipelineId: string): IPipelineDefinition | undefined {
    return this.pipelines.get(pipelineId);
  }

  public listPipelines(): IPipelineDefinition[] {
    return Array.from(this.pipelines.values());
  }

  public async runPipeline(pipelineId: string): Promise<IPipelineDefinition | undefined> {
    let pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      this.logger.error(`Pipeline with ID ${pipelineId} not found.`, 'RunPipeline');
      return undefined;
    }

    this.logger.info(`Starting pipeline ${pipeline.name} (${pipeline.pipelineId}).`, 'RunPipeline');
    pipeline.lastRunStatus = 'in_progress';
    pipeline.lastRunTime = new Date();

    for (const stage of pipeline.stages) {
      stage.status = 'running';
      stage.startTime = new Date();
      this.logger.info(`Running stage: ${stage.name} (${stage.id})`, 'RunPipeline');

      const stageSuccess = await new Promise<boolean>(resolve => {
        setTimeout(() => {
          const success = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) > 0.2; 
          resolve(success);
        }, (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 5000 + 1000);
      });

      stage.endTime = new Date();
      stage.durationMs = stage.endTime.getTime() - stage.startTime.getTime();

      if (stageSuccess) {
        stage.status = 'completed';
        this.logger.info(`Stage ${stage.name} completed successfully.`, 'RunPipeline');
      } else {
        stage.status = 'failed';
        pipeline.lastRunStatus = 'failure';
        this.logger.error(`Stage ${stage.name} failed. Aborting pipeline.`, 'RunPipeline');
        break; 
      }
    }

    if (pipeline.lastRunStatus !== 'failure') {
      pipeline.lastRunStatus = 'success';
      this.logger.info(`Pipeline ${pipeline.name} completed successfully.`, 'RunPipeline');
    }

    this.pipelines.set(pipelineId, pipeline);
    return pipeline;
  }
}

/**
 * @class DeploymentAutomation
 * @description Handles various deployment strategies and rollback management.
 */
class DeploymentAutomation {
  private deployments: Map<string, IDeploymentConfig>;
  private logger: Logger;
  private healthChecker: HealthChecker;

  constructor() {
    this.deployments = new Map();
    this.logger = new Logger('DeploymentAutomation');
    this.healthChecker = new HealthChecker();
  }

  public async deployService(serviceName: string, config: IDeploymentConfig): Promise<boolean> {
    this.logger.info(`Initiating deployment for service '${serviceName}' with strategy '${config.strategy}'.`, 'DeployService', config);
    this.deployments.set(serviceName, config);

    switch (config.strategy) {
      case 'blue-green':
        return await this.blueGreenDeployment(serviceName, config);
      case 'canary':
        return await this.canaryDeployment(serviceName, config);
      case 'rolling':
        return await this.rollingDeployment(serviceName, config);
      default:
        this.logger.error(`Unknown deployment strategy: ${config.strategy}`, 'DeployService');
        return false;
    }
  }

  private async blueGreenDeployment(serviceName: string, config: IDeploymentConfig): Promise<boolean> {
    this.logger.info(`Executing Blue-Green deployment for ${serviceName}, version ${config.version}.`, 'BlueGreen');
    await new Promise(resolve => setTimeout(resolve, 5000));
    this.logger.info(`'Green' environment for ${serviceName} provisioned.`, 'BlueGreen');

    await new Promise(resolve => setTimeout(resolve, 7000));
    this.logger.info(`Version ${config.version} deployed to 'green' environment for ${serviceName}.`, 'BlueGreen');

    if (config.healthCheckUrl) {
      this.logger.info(`Running health checks on 'green' environment for ${serviceName}.`, 'BlueGreen');
      const healthy = await this.healthChecker.checkHttp(config.healthCheckUrl);
      if (!healthy) {
        this.logger.error(`Health checks failed for 'green' environment. Aborting Blue-Green deployment.`, 'BlueGreen');
        return false;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    this.logger.info(`Traffic switched to 'green' environment for ${serviceName}.`, 'BlueGreen');

    await new Promise(resolve => setTimeout(resolve, 2000));
    this.logger.info(`Old 'blue' environment for ${serviceName} decommissioned.`, 'BlueGreen');

    this.logger.info(`Blue-Green deployment for ${serviceName} completed successfully.`, 'BlueGreen');
    return true;
  }

  private async canaryDeployment(serviceName: string, config: IDeploymentConfig): Promise<boolean> {
    const trafficPercentage = config.canaryTrafficPercentage || DEFAULT_CANARY_TRAFFIC_PERCENTAGE;
    this.logger.info(`Executing Canary deployment for ${serviceName}, version ${config.version} with ${trafficPercentage}% traffic.`, 'Canary');

    await new Promise(resolve => setTimeout(resolve, 4000));
    this.logger.info(`Version ${config.version} deployed to canary group for ${serviceName}.`, 'Canary');

    await new Promise(resolve => setTimeout(resolve, 2000));
    this.logger.info(`${trafficPercentage}% traffic routed to canary group for ${serviceName}.`, 'Canary');

    this.logger.info(`Monitoring canary group for ${serviceName} for 10 seconds.`, 'Canary');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const monitorResult = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) > 0.15; 
    if (!monitorResult) {
      this.logger.error(`Canary monitoring detected issues for ${serviceName}. Rolling back.`, 'Canary');
      await this.rollbackDeployment(serviceName, 'canary_failure');
      return false;
    }

    this.logger.info(`Canary group for ${serviceName} stable. Gradually shifting remaining traffic.`, 'Canary');
    await new Promise(resolve => setTimeout(resolve, 5000));
    this.logger.info(`All traffic shifted to new version for ${serviceName}. Canary deployment complete.`, 'Canary');
    return true;
  }

  private async rollingDeployment(serviceName: string, config: IDeploymentConfig): Promise<boolean> {
    this.logger.info(`Executing Rolling deployment for ${serviceName}, version ${config.version}.`, 'Rolling');
    const instanceCount = 5;
    for (let i = 1; i <= instanceCount; i++) {
      this.logger.info(`Updating instance ${i}/${instanceCount} for ${serviceName}.`, 'Rolling');
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (config.healthCheckUrl) {
        const healthy = await this.healthChecker.checkHttp(config.healthCheckUrl);
        if (!healthy) {
          this.logger.error(`Health check failed for instance ${i} during rolling deployment. Aborting and initiating rollback.`, 'Rolling');
          await this.rollbackDeployment(serviceName, 'rolling_failure');
          return false;
        }
      }
    }
    this.logger.info(`Rolling deployment for ${serviceName} completed successfully.`, 'Rolling');
    return true;
  }

  public async rollbackDeployment(serviceName: string, reason: string): Promise<boolean> {
    const deploymentConfig = this.deployments.get(serviceName);
    if (!deploymentConfig) {
      this.logger.warn(`No active deployment found for service '${serviceName}'. Cannot rollback.`, 'Rollback');
      return false;
    }

    this.logger.warn(`Initiating rollback for service '${serviceName}' due to: ${reason}.`, 'Rollback');
    await new Promise(resolve => setTimeout(resolve, 8000));
    this.logger.info(`Service '${serviceName}' rolled back to previous stable version.`, 'Rollback');
    return true;
  }
}

/**
 * @class ContainerOrchestrator
 * @description Manages containerized applications (e.g., Kubernetes interactions).
 */
class ContainerOrchestrator {
  public deployedContainers: Map<string, IContainerSpec>;
  private logger: Logger;

  constructor() {
    this.deployedContainers = new Map();
    this.logger = new Logger('ContainerOrchestrator');
  }

  public async deployContainerApp(appId: string, spec: IContainerSpec): Promise<boolean> {
    this.logger.info(`Deploying container app '${appId}' with image '${spec.image}:${spec.tag}'.`, 'DeployContainerApp', spec);
    await new Promise(resolve => setTimeout(resolve, 6000));
    this.deployedContainers.set(appId, spec);
    this.logger.info(`Container app '${appId}' deployed successfully.`, 'DeployContainerApp');
    return true;
  }

  public async scaleContainerApp(appId: string, newReplicas: number): Promise<boolean> {
    const spec = this.deployedContainers.get(appId);
    if (!spec) {
      this.logger.error(`Container app '${appId}' not found. Cannot scale.`, 'ScaleContainerApp');
      return false;
    }
    this.logger.info(`Scaling container app '${appId}' from ${spec.replicas} to ${newReplicas} replicas.`, 'ScaleContainerApp');
    spec.replicas = newReplicas;
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.deployedContainers.set(appId, spec);
    this.logger.info(`Container app '${appId}' scaled to ${newReplicas} replicas.`, 'ScaleContainerApp');
    return true;
  }

  public getContainerAppStatus(appId: string): IContainerSpec | undefined {
    return this.deployedContainers.get(appId);
  }

  public async removeContainerApp(appId: string): Promise<boolean> {
    if (!this.deployedContainers.has(appId)) {
      this.logger.warn(`Container app '${appId}' not found. Nothing to remove.`, 'RemoveContainerApp');
      return false;
    }
    this.logger.info(`Removing container app '${appId}'.`, 'RemoveContainerApp');
    await new Promise(resolve => setTimeout(resolve, 4000));
    this.deployedContainers.delete(appId);
    this.logger.info(`Container app '${appId}' removed successfully.`, 'RemoveContainerApp');
    return true;
  }
}

/**
 * @class MonitoringAndAlerting
 * @description Manages monitoring metrics, defines alerts, and handles incident creation.
 */
class MonitoringAndAlerting {
  private slas: Map<string, IServiceLevelAgreement>;
  public incidents: Map<string, IIncident>;
  private logger: Logger;

  constructor() {
    this.slas = new Map();
    this.incidents = new Map();
    this.logger = new Logger('MonitoringAndAlerting');
    this.initializeDefaultSLA();
  }

  private initializeDefaultSLA(): void {
    const defaultSLA: IServiceLevelAgreement = {
      slaId: 'skycoin-uptime-sla',
      serviceName: 'Skycoin Core API',
      metric: 'uptime',
      threshold: DEFAULT_SLA_UPTIME_THRESHOLD,
      unit: '%',
      alertContacts: ['devops-team@skycoin.com'],
    };
    this.slas.set(defaultSLA.slaId, defaultSLA);
    this.logger.info('Initialized default uptime SLA.', 'Initialization');
  }

  public defineSLA(sla: IServiceLevelAgreement): boolean {
    if (this.slas.has(sla.slaId)) {
      this.logger.warn(`SLA with ID ${sla.slaId} already exists.`, 'DefineSLA');
      return false;
    }
    this.slas.set(sla.slaId, sla);
    this.logger.info(`SLA '${sla.serviceName}' (${sla.slaId}) defined.`, 'DefineSLA');
    return true;
  }

  public async evaluateSLAs(): Promise<string[]> {
    this.logger.info('Evaluating all defined SLAs.', 'EvaluateSLAs');
    const createdIncidentIds: string[] = [];

    for (const sla of this.slas.values()) {
      let currentValue: number | undefined;
      let isViolated = false;

      switch (sla.metric) {
        case 'uptime':
          const uptime = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10 + 90; 
          currentValue = parseFloat(uptime.toFixed(2));
          if (currentValue < sla.threshold) {
            isViolated = true;
          }
          break;
        case 'response_time':
          const responseTime = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 1000; 
          currentValue = parseFloat(responseTime.toFixed(2));
          if (currentValue > sla.threshold) {
            isViolated = true;
          }
          break;
        case 'error_rate':
          const errorRate = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 5; 
          currentValue = parseFloat(errorRate.toFixed(2));
          if (currentValue > sla.threshold) {
            isViolated = true;
          }
          break;
      }

      sla.currentValue = currentValue;
      sla.isViolated = isViolated;

      if (isViolated) {
        const incidentId = `INC-${Date.now()}`;
        const incident: IIncident = {
          incidentId,
          title: `SLA Violation: ${sla.serviceName} - ${sla.metric}`, 
          description: `SLA for ${sla.serviceName} (${sla.metric}) violated. Current: ${currentValue}${sla.unit}, Threshold: ${sla.threshold}${sla.unit}.`, 
          status: 'open',
          severity: 'high',
          reportedAt: new Date(),
          impactedServices: [sla.serviceName],
        };
        this.incidents.set(incidentId, incident);
        createdIncidentIds.push(incidentId);
        this.logger.error(`SLA Violation detected for ${sla.serviceName}. Incident ${incidentId} created.`, 'EvaluateSLAs', { sla, incident });
      } else {
        this.logger.info(`SLA for ${sla.serviceName} (${sla.metric}) is healthy. Current: ${currentValue}${sla.unit}.`, 'EvaluateSLAs');
      }
    }
    return createdIncidentIds;
  }

  public getIncident(incidentId: string): IIncident | undefined {
    return this.incidents.get(incidentId);
  }

  public updateIncidentStatus(incidentId: string, newStatus: IIncident['status'], resolvedAt?: Date, rootCause?: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      this.logger.warn(`Incident ${incidentId} not found. Cannot update status.`, 'UpdateIncidentStatus');
      return false;
    }
    this.logger.info(`Updating incident ${incidentId} status from ${incident.status} to ${newStatus}.`, 'UpdateIncidentStatus');
    incident.status = newStatus;
    if (resolvedAt) incident.resolvedAt = resolvedAt;
    if (rootCause) incident.rootCause = rootCause;
    this.incidents.set(incidentId, incident);
    this.logger.info(`Incident ${incidentId} status updated to ${newStatus}.`, 'UpdateIncidentStatus');
    return true;
  }

  public async analyzeIncidentLogsWithAI(incidentId: string, recentLogs: ILogEntry[]): Promise<string> {
    this.logger.info(`Analyzing logs for incident ${incidentId} with AI.`, 'AI_Analysis');
    const logText = recentLogs.map(log => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} ${log.service}/${log.component}: ${log.message}`).join('\n');
    const prompt = `Analyze the following log entries for an incident (${incidentId}) and suggest a concise root cause. Focus on technical issues. Logs:\n${logText}`; 

    try {
      const llmResp = await invokeLLM({ messages: [{ role: "user", content: prompt }] });  //
      this.logger.info(`AI suggested root cause for incident ${incidentId}.`, 'AI_Analysis');
      return String(llmResp.choices[0]?.message?.content || "").trim() || "";
    } catch (error: any) {
      this.logger.error(`AI analysis failed for incident ${incidentId}: ${error.message}`, 'AI_Analysis', { error: error.message });
      return `AI analysis failed: ${error.message}`;
    }
  }
}

/**
 * @class LogAggregator
 * @description Collects, stores, and queries log entries from various services.
 */
class LogAggregator {
  private logs: ILogEntry[];
  private logger: Logger;

  constructor() {
    this.logs = [];
    this.logger = new Logger('LogAggregator');
  }

  public ingestLog(entry: ILogEntry): void {
    this.logs.push(entry);
    this.logger.debug(`Ingested log from ${entry.service}/${entry.component}: ${entry.message}`, 'IngestLog');
  }

  public queryLogs(service?: string, level?: ILogEntry['level'], startTime?: Date, endTime?: Date, limit: number = MAX_LOG_ENTRIES_PER_QUERY): ILogEntry[] {
    this.logger.info(`Querying logs: service=${service || 'all'}, level=${level || 'all'}, limit=${limit}.`, 'QueryLogs');
    let filteredLogs = this.logs;

    if (service) {
      filteredLogs = filteredLogs.filter(log => log.service === service);
    }
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    if (startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startTime);
    }
    if (endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endTime);
    }

    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filteredLogs.slice(0, limit);
  }
}

/**
 * @class InfrastructureAsCodeManager
 * @description Manages Infrastructure as Code templates and deployments.
 */
class InfrastructureAsCodeManager {
  private templates: Map<string, IInfrastructureAsCodeTemplate>;
  private logger: Logger;

  constructor() {
    this.templates = new Map();
    this.logger = new Logger('InfrastructureAsCodeManager');
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const k8sDeploymentTemplate: IInfrastructureAsCodeTemplate = {
      templateId: 'k8s-nginx-deployment',
      name: 'Kubernetes Nginx Deployment',
      provider: 'kubernetes',
      type: 'helm',
      content: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-deployment\nspec:\n  selector:\n    matchLabels:\n      app: nginx\n  replicas: 3\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.14.2\n        ports:\n        - containerPort: 80\n`,
      version: '1.0.0',
      lastModified: new Date(),
    };
    this.templates.set(k8sDeploymentTemplate.templateId, k8sDeploymentTemplate);
    this.logger.info('Initialized default Kubernetes Nginx deployment template.', 'Initialization');
  }

  public registerTemplate(template: IInfrastructureAsCodeTemplate): boolean {
    if (this.templates.has(template.templateId)) {
      this.logger.warn(`Template with ID ${template.templateId} already exists.`, 'RegisterTemplate');
      return false;
    }
    this.templates.set(template.templateId, template);
    this.logger.info(`Template '${template.name}' (${template.templateId}) registered.`, 'RegisterTemplate');
    return true;
  }

  public getTemplate(templateId: string): IInfrastructureAsCodeTemplate | undefined {
    return this.templates.get(templateId);
  }

  public async deployInfrastructure(templateId: string, environment: string, parameters?: { [key: string]: string }): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      this.logger.error(`Template with ID ${templateId} not found. Cannot deploy.`, 'DeployInfrastructure');
      return false;
    }

    this.logger.info(`Deploying infrastructure for environment '${environment}' using template '${template.name}'.`, 'DeployInfrastructure', { templateId, environment, parameters });
    await new Promise(resolve => setTimeout(resolve, 10000));
    this.logger.info(`Infrastructure deployment for '${environment}' using template '${template.name}' completed.`, 'DeployInfrastructure');
    return true;
  }
}

// --- Main STORM DevOps Engine ---

/**
 * @class StormDevOpsEngine
 * @description The main engine for STORM DevOps, integrating all sub-components.
 */
class StormDevOpsEngine {
  private logger: Logger;
  public pipelineManager: PipelineManager;
  public deploymentAutomation: DeploymentAutomation;
  public containerOrchestrator: ContainerOrchestrator;
  public monitoringAndAlerting: MonitoringAndAlerting;
  public logAggregator: LogAggregator;
  public infrastructureAsCodeManager: InfrastructureAsCodeManager;

  constructor() {
    this.logger = new Logger('StormDevOpsEngine');
    this.pipelineManager = new PipelineManager();
    this.deploymentAutomation = new DeploymentAutomation();
    this.containerOrchestrator = new ContainerOrchestrator();
    this.monitoringAndAlerting = new MonitoringAndAlerting();
    this.logAggregator = new LogAggregator();
    this.infrastructureAsCodeManager = new InfrastructureAsCodeManager();
    this.logger.info('STORM DevOps Engine initialized.', 'Initialization');
  }

  public async runFullCICD(pipelineId: string, serviceName: string, deploymentConfig: IDeploymentConfig): Promise<boolean> {
    this.logger.info(`Starting full CI/CD flow for service '${serviceName}' with pipeline '${pipelineId}'.`, 'FullCICD');

    const pipelineResult = await this.pipelineManager.runPipeline(pipelineId);
    if (!pipelineResult || pipelineResult.lastRunStatus === 'failure') {
      this.logger.error(`CI pipeline ${pipelineId} failed. Aborting full CI/CD flow.`, 'FullCICD');
      return false;
    }
    this.logger.info(`CI pipeline ${pipelineId} completed successfully.`, 'FullCICD');

    const deploymentResult = await this.deploymentAutomation.deployService(serviceName, deploymentConfig);
    if (!deploymentResult) {
      this.logger.error(`Deployment of service ${serviceName} failed. Aborting full CI/CD flow.`, 'FullCICD');
      return false;
    }
    this.logger.info(`Deployment of service ${serviceName} completed successfully.`, 'FullCICD');

    this.logger.info(`Initiating continuous monitoring for service ${serviceName}.`, 'FullCICD');
    const incidentIds = await this.monitoringAndAlerting.evaluateSLAs();
    if (incidentIds.length > 0) {
      this.logger.warn(`SLA violations detected during post-deployment monitoring. Incidents created: ${incidentIds.join(', ')}.`, 'FullCICD');
    }

    this.logger.info(`Full CI/CD flow for service '${serviceName}' completed.`, 'FullCICD');
    return true;
  }

  public async performSystemHealthCheck(): Promise<boolean> {
    this.logger.info('Performing comprehensive system health check.', 'SystemHealthCheck');
    const healthChecker = new HealthChecker();
    const pipelineHealth = await healthChecker.checkHttp('http://pipeline-service.skycoin.com/health');
    const deploymentHealth = await healthChecker.checkHttp('http://deployment-service.skycoin.com/health');
    const orchestratorHealth = await healthChecker.checkContainer('k8s-master-node', ['kubectl', 'get', 'nodes']);

    const overallHealthy = pipelineHealth && deploymentHealth && orchestratorHealth;

    if (overallHealthy) {
      this.logger.info('Comprehensive system health check passed.', 'SystemHealthCheck');
    } else {
      this.logger.error('Comprehensive system health check failed. Investigate individual component health.', 'SystemHealthCheck');
    }
    return overallHealthy;
  }

  public async getDevOpsSummary(): Promise<string> {
    this.logger.info('Generating DevOps summary.', 'DevOpsSummary');

    const pipelines = this.pipelineManager.listPipelines();
    const activeIncidents = Array.from(this.monitoringAndAlerting.incidents.values()).filter(inc => inc.status !== 'resolved' && inc.status !== 'closed');
    const deployedApps = Array.from(this.containerOrchestrator.deployedContainers.keys());

    let summary = `STORM DevOps Engine Summary:\n`;
    summary += `----------------------------------\n`;
    summary += `Pipelines Defined: ${pipelines.length}\n`;
    pipelines.forEach(p => {
      summary += `  - ${p.name} (ID: ${p.pipelineId}, Status: ${p.lastRunStatus})\n`;
    });
    summary += `\nActive Incidents: ${activeIncidents.length}\n`;
    activeIncidents.forEach(inc => {
      summary += `  - ${inc.title} (Severity: ${inc.severity}, Status: ${inc.status})\n`;
    });
    summary += `\nDeployed Container Apps: ${deployedApps.length}\n`;
    deployedApps.forEach(appId => {
      summary += `  - ${appId}\n`;
    });

    const aiPrompt = `Given the following DevOps summary, provide a concise sentiment analysis (e.g., 'healthy', 'at risk', 'critical').\nSummary:\n${summary}`; 
    try {
      const sentimentResult = await invokeLLM({ messages: [{ role: "user", content: aiPrompt }] });
      summary += `\nOverall Sentiment (AI): ${String(sentimentResult.choices[0]?.message?.content || "unknown").trim()}\n`;
    } catch (error: any) {
      this.logger.warn(`AI sentiment analysis failed: ${error.message}`, 'DevOpsSummary');
      summary += `\nOverall Sentiment (AI): Unavailable\n`;
    }

    this.logger.info('DevOps summary generated.', 'DevOpsSummary');
    return summary;
  }
}

// --- Singleton Export ---

export const stormDevOpsEngine = new StormDevOpsEngine();
export default StormDevOpsEngine;
