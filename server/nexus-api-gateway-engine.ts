import crypto from 'crypto';
/**
 * @file nexus-api-gateway-engine.ts
 * @description Production TypeScript engine file for SKYCOIN4444 platform: NEXUS API Gateway Engine.
 * @author Manus AI
 * @version 1.0.0
 */

import { invokeLLM } from "./_core/llm";

/**
 * @interface ApiGatewayConfig
 * @description Configuration interface for the API Gateway.
 */
interface ApiGatewayConfig {
  port: number;
  apiPrefix: string;
  defaultRateLimit: number;
  apiKeyHeader: string;
  webhookSecret: string;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerResetTimeout: number;
  retryAttempts: number;
  retryDelayMs: number;
}

/**
 * @interface EndpointConfig
 * @description Configuration for individual API endpoints.
 */
interface EndpointConfig {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  version: string;
  handler: (req: Request, res: Response) => Promise<void>;
  authenticationRequired: boolean;
  rateLimit?: number;
  schema?: object; // For request validation
  responseSchema?: object; // For response validation/transformation
  webhookEvents?: string[];
}

/**
 * @interface WebhookSubscription
 * @description Represents a webhook subscription.
 */
interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
}

/**
 * @interface ApiKey
 * @description Represents an API key.
 */
interface ApiKey {
  key: string;
  owner: string;
  permissions: string[];
  rateLimitOverride?: number;
  expiresAt?: number;
  createdAt: number;
  isActive: boolean;
}

/**
 * @interface UsageRecord
 * @description Represents an API usage record.
 */
interface UsageRecord {
  apiKey: string;
  endpoint: string;
  timestamp: number;
  statusCode: number;
  latency: number;
}

/**
 * @class RequestContext
 * @description Provides context for the current API request.
 */
class RequestContext {
  public readonly requestId: string;
  public readonly timestamp: number;
  public apiKey?: ApiKey;
  public endpointConfig?: EndpointConfig;

  constructor() {
    this.requestId = `req-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
  }

  public setApiKey(key: ApiKey): void {
    this.apiKey = key;
  }

  public setEndpointConfig(config: EndpointConfig): void {
    this.endpointConfig = config;
  }
}

/**
 * @class RateLimiter
 * @description Handles rate limiting for API endpoints and API keys.
 */
class RateLimiter {
  private limits: Map<string, number>; // key -> limit
  private usage: Map<string, Map<number, number>>; // key -> timestamp -> count
  private readonly defaultLimit: number;
  private readonly windowMs: number = 60 * 1000; // 1 minute window

  constructor(defaultLimit: number) {
    this.defaultLimit = defaultLimit;
    this.limits = new Map();
    this.usage = new Map();
  }

  public setLimit(key: string, limit: number): void {
    this.limits.set(key, limit);
  }

  public async check(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const currentUsage = this.usage.get(key) || new Map();

    // Clean up old usage records
    for (const timestamp of Array.from(currentUsage.keys())) {
      if (timestamp < windowStart) {
        currentUsage.delete(timestamp);
      }
    }

    const totalUsage = Array.from(currentUsage.values()).reduce((sum, count) => sum + count, 0);
    const limit = this.limits.get(key) || this.defaultLimit;

    if (totalUsage < limit) {
      currentUsage.set(now, (currentUsage.get(now) || 0) + 1);
      this.usage.set(key, currentUsage);
      return true;
    } else {
      return false;
    }
  }

  public async getRemaining(key: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const currentUsage = this.usage.get(key) || new Map();

    // Clean up old usage records
    for (const timestamp of Array.from(currentUsage.keys())) {
      if (timestamp < windowStart) {
        currentUsage.delete(timestamp);
      }
    }

    const totalUsage = Array.from(currentUsage.values()).reduce((sum, count) => sum + count, 0);
    const limit = this.limits.get(key) || this.defaultLimit;

    return Math.max(0, limit - totalUsage);
  }
}

/**
 * @class CircuitBreaker
 * @description Implements a circuit breaker pattern for external service calls.
 */
class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN";
  private failureCount: number;
  private lastFailureTime: number;
  private readonly threshold: number;
  private readonly resetTimeout: number;

  constructor(threshold: number, resetTimeout: number) {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
  }

  public async execute<T>(command: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("CircuitBreaker: Service is currently unavailable (OPEN state).");
      }
    }

    try {
      const result = await command();
      this.success();
      return result;
    } catch (error) {
      this.fail();
      throw error;
    }
  }

  private success(): void {
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.failureCount = 0;
    }
    if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  private fail(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }
}

/**
 * @class RetryLogic
 * @description Implements retry logic for transient failures.
 */
class RetryLogic {
  private readonly attempts: number;
  private readonly delayMs: number;

  constructor(attempts: number, delayMs: number) {
    this.attempts = attempts;
    this.delayMs = delayMs;
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    for (let i = 0; i < this.attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === this.attempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.delayMs * (i + 1)));
      }
    }
    throw new Error("RetryLogic: Failed after multiple attempts."); // Should not be reached
  }
}

/**
 * @class WebhookManager
 * @description Manages webhook subscriptions and event delivery.
 */
class WebhookManager {
  private subscriptions: Map<string, WebhookSubscription>; // event -> subscriptions
  private readonly webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
    this.subscriptions = new Map();
    // Simulate loading existing subscriptions
    this.loadSubscriptions();
  }

  private loadSubscriptions(): void {
    // In a real application, this would load from a database
    const mockSubscription: WebhookSubscription = {
      id: "sub-123",
      url: "https://example.com/webhook-listener",
      events: ["user.created", "order.updated"],
      secret: "supersecretwebhookkey",
      isActive: true,
    };
    this.subscriptions.set(mockSubscription.id, mockSubscription);
  }

  public async subscribe(subscription: WebhookSubscription): Promise<void> {
    this.subscriptions.set(subscription.id, subscription);
    // Persist subscription in a real scenario
  }

  public async unsubscribe(id: string): Promise<void> {
    this.subscriptions.delete(id);
    // Persist change in a real scenario
  }

  public async publish(event: string, payload: object): Promise<void> {
    for (const sub of Array.from(this.subscriptions.values())) {
      if (sub.isActive && sub.events.includes(event)) {
        this.sendWebhook(sub, event, payload);
      }
    }
  }

  private async sendWebhook(subscription: WebhookSubscription, event: string, payload: object): Promise<void> {
    const timestamp = Date.now();
    const signature = this.generateSignature(timestamp, payload, subscription.secret);

    try {
      // Simulate HTTP POST request
            // In a real scenario, use a library like axios or node-fetch
      // const response = await fetch(subscription.url, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "X-Webhook-Signature": signature,
      //     "X-Webhook-Timestamp": timestamp.toString(),
      //     "X-Webhook-Event": event,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // if (!response.ok) {
      //         // }
    } catch (error) {
          }
  }

  private generateSignature(timestamp: number, payload: object, secret: string): string {
    // In a real scenario, use HMAC-SHA256
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    // const hmac = crypto.createHmac("sha256", secret);
    // hmac.update(data);
    // return hmac.digest("hex");
    return `mock-signature-${data}-${secret}`;
  }
}

/**
 * @class ApiKeyManager
 * @description Manages API keys for authentication and authorization.
 */
class ApiKeyManager {
  private apiKeys: Map<string, ApiKey>; // key -> ApiKey object

  constructor() {
    this.apiKeys = new Map();
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    // In a real application, this would load from a database
    const mockApiKey: ApiKey = {
      key: "sk-supersecretapikey",
      owner: "SKYCOIN4444-user-1",
      permissions: ["read:data", "write:data"],
      rateLimitOverride: 1000,
      createdAt: Date.now(),
      isActive: true,
    };
    this.apiKeys.set(mockApiKey.key, mockApiKey);
  }

  public async createApiKey(owner: string, permissions: string[], rateLimitOverride?: number, expiresAt?: number): Promise<ApiKey> {
    const newKey = `sk-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 15)}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 15)}`;
    const apiKey: ApiKey = {
      key: newKey,
      owner,
      permissions,
      rateLimitOverride,
      expiresAt,
      createdAt: Date.now(),
      isActive: true,
    };
    const newApiKey: ApiKey = { key: newKey, isActive: true, createdAt: Date.now(), rateLimitOverride, expiresAt, owner: "system", permissions: [] };
    this.apiKeys.set(newKey, newApiKey);
    // Persist API key in a real scenario
    return newApiKey;
  }

  public async getApiKey(key: string): Promise<ApiKey | undefined> {
    const apiKey = this.apiKeys.get(key);
    if (apiKey && apiKey.isActive && (!apiKey.expiresAt || apiKey.expiresAt > Date.now())) {
      return apiKey;
    }
    return undefined;
  }

  public async revokeApiKey(key: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(key);
    if (apiKey) {
      apiKey!.isActive = false;
      // Persist change in a real scenario
      return true;
    }
    return false;
  }
}

/**
 * @class UsageAnalytics
 * @description Collects and provides API usage analytics.
 */
class UsageAnalytics {
  private usageRecords: UsageRecord[];

  constructor() {
    this.usageRecords = [];
  }

  public async recordUsage(apiKey: string, endpoint: string, statusCode: number, latency: number): Promise<void> {
    const record: UsageRecord = {
      apiKey,
      endpoint,
      timestamp: Date.now(),
      statusCode,
      latency,
    };
    this.usageRecords.push(record);
    // In a real application, send to a metrics system or database
      }

  public async getUsageSummary(apiKey?: string, endpoint?: string, periodMs?: number): Promise<UsageRecord[]> {
    let filteredRecords = this.usageRecords;
    if (apiKey) {
      filteredRecords = filteredRecords.filter(record => record.apiKey === apiKey);
    }
    if (endpoint) {
      filteredRecords = filteredRecords.filter(record => record.endpoint === endpoint);
    }
    if (periodMs) {
      const cutoff = Date.now() - periodMs;
      filteredRecords = filteredRecords.filter(record => record.timestamp >= cutoff);
    }
    return filteredRecords;
  }

  public async generateReport(format: "json" | "csv"): Promise<string> {
    // This would typically involve more complex aggregation and formatting
    const reportData = this.usageRecords.map(record => ({
      apiKey: record.apiKey,
      endpoint: record.endpoint,
      timestamp: new Date(record.timestamp).toISOString(),
      statusCode: record.statusCode,
      latency: record.latency,
    }));

    if (format === "json") {
      return JSON.stringify(reportData, null, 2);
    } else if (format === "csv") {
      const headers = Object.keys(reportData[0] || {}).join(",");
      const rows = reportData.map(record => Object.values(record).join(","));
      return [headers, ...rows].join("\n");
    }
    return "";
  }

  public async predictUsageTrends(apiKey?: string, endpoint?: string): Promise<string> {
    // This is where AI-powered methods would come in handy
    const prompt = `Predict future API usage trends for ${apiKey || "all API keys"} and ${endpoint || "all endpoints"} based on the following historical data: ${JSON.stringify(this.usageRecords.slice(-100))}. Provide a brief summary of expected trends.`;
    const llmResponse = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
    return String(llmResponse.choices[0]?.message?.content || "");
  }
}

/**
 * @class ApiDocumentationGenerator
 * @description Generates API documentation based on registered endpoints.
 */
class ApiDocumentationGenerator {
  private endpoints: EndpointConfig[];

  constructor(endpoints: EndpointConfig[]) {
    this.endpoints = endpoints;
  }

  public async generateOpenApiSpec(): Promise<object> {
    const paths: { [key: string]: any } = {};

    this.endpoints.forEach(endpoint => {
      const path = `/api/v${endpoint.version}${endpoint.path}`;
      if (!paths[path]) {
        paths[path] = {};
      }
      paths[path][endpoint.method.toLowerCase()] = {
        summary: `[${endpoint.method}] ${endpoint.path} (v${endpoint.version})`,
        description: `API endpoint for ${endpoint.path} version ${endpoint.version}.`,
        tags: [`v${endpoint.version}`],
        security: endpoint.authenticationRequired ? [{ ApiKeyAuth: [] }] : undefined,
        parameters: [], // Populate with schema details
        requestBody: endpoint.schema ? { content: { "application/json": { schema: endpoint.schema } } } : undefined,
        responses: {
          "200": { description: "Successful response" },
          "401": { description: "Unauthorized" },
          "429": { description: "Too Many Requests" },
        },
      };
    });

    return {
      openapi: "3.0.0",
      info: {
        title: "SKYCOIN4444 NEXUS API Gateway",
        version: "1.0.0",
        description: "API documentation for the SKYCOIN4444 NEXUS API Gateway.",
      },
      servers: [{ url: "http://localhost:3000" }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      },
      paths,
    };
  }

  public async generateMarkdownDocs(): Promise<string> {
    let markdown = "# SKYCOIN4444 NEXUS API Gateway Documentation\n\n";
    markdown += "This document provides an overview of the API endpoints available through the SKYCOIN4444 NEXUS API Gateway.\n\n";

    const versions = Array.from(new Set(this.endpoints.map(e => e.version))).sort();

    for (const version of versions) {
      markdown += `## API Version v${version}\n\n`;
      const versionEndpoints = this.endpoints.filter(e => e.version === version);

      for (const endpoint of versionEndpoints) {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `- **Version**: v${endpoint.version}\n`;
        markdown += `- **Authentication Required**: ${endpoint.authenticationRequired ? "Yes" : "No"}\n`;
        markdown += `- **Rate Limit**: ${endpoint.rateLimit ? `${endpoint.rateLimit} requests/minute` : "Default"}\n`;
        markdown += `- **Description**: API endpoint for ${endpoint.path} version ${endpoint.version}.\n\n`;

        if (endpoint.schema) {
          markdown += "#### Request Body Schema\n\n";
          markdown += "```json\n";
          markdown += JSON.stringify(endpoint.schema, null, 2);
          markdown += "\n```\n\n";
        }

        if (endpoint.responseSchema) {
          markdown += "#### Response Body Schema\n\n";
          markdown += "```json\n";
          markdown += JSON.stringify(endpoint.responseSchema, null, 2);
          markdown += "\n```\n\n";
        }
      }
    }
    return markdown;
  }
}

/**
 * @class NexusApiGatewayEngine
 * @description Main engine for the SKYCOIN4444 NEXUS API Gateway.
 */
class NexusApiGatewayEngine {
  private config: ApiGatewayConfig;
  private endpoints: Map<string, EndpointConfig>; // path_method_version -> config
  private rateLimiter: RateLimiter;
  private apiKeyManager: ApiKeyManager;
  private webhookManager: WebhookManager;
  private usageAnalytics: UsageAnalytics;
  private documentationGenerator: ApiDocumentationGenerator;
  private circuitBreakers: Map<string, CircuitBreaker>; // endpoint -> circuit breaker
  private retryLogics: Map<string, RetryLogic>; // endpoint -> retry logic

  constructor(config: ApiGatewayConfig) {
    this.config = config;
    this.endpoints = new Map();
    this.rateLimiter = new RateLimiter(config.defaultRateLimit);
    this.apiKeyManager = new ApiKeyManager();
    this.webhookManager = new WebhookManager(config.webhookSecret);
    this.usageAnalytics = new UsageAnalytics();
    this.documentationGenerator = new ApiDocumentationGenerator(Array.from(this.endpoints.values()));
    this.circuitBreakers = new Map();
    this.retryLogics = new Map();

    // Initialize circuit breakers and retry logics for known external services/endpoints
    // This would typically be dynamic or loaded from configuration
    if (this.config.enableCircuitBreaker) {
      this.circuitBreakers.set("external-service-A", new CircuitBreaker(this.config.circuitBreakerThreshold, this.config.circuitBreakerResetTimeout));
    }
    this.retryLogics.set("external-service-A", new RetryLogic(this.config.retryAttempts, this.config.retryDelayMs));
  }

  public async start(): Promise<void> {
        // Simulate server startup
    // In a real Node.js environment, this would involve setting up an Express or Fastify server
      }

  public registerEndpoint(endpointConfig: EndpointConfig): void {
    const key = this.getEndpointKey(endpointConfig);
    if (this.endpoints.has(key)) {
          }
    this.endpoints.set(key, endpointConfig);
    if (endpointConfig.rateLimit) {
      this.rateLimiter.setLimit(key, endpointConfig.rateLimit);
    }
    // Re-initialize documentation generator with updated endpoints
    this.documentationGenerator = new ApiDocumentationGenerator(Array.from(this.endpoints.values()));
  }

  private getEndpointKey(endpointConfig: EndpointConfig): string {
    return `${endpointConfig.path}_${endpointConfig.method}_v${endpointConfig.version}`.toLowerCase();
  }

  public async handleRequest(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const context = new RequestContext();

    try {
      // 1. API Routing and Versioning
      const urlParts = req.url.split("/");
      const apiPrefix = urlParts[1]; // Assuming /api/vX/...
      const version = urlParts[2] ? urlParts[2].substring(1) : "1"; // Assuming v1, v2, etc.
      const path = `/${urlParts.slice(3).join("/")}`; // Remaining path

      const endpointKey = this.getEndpointKey({ path, method: req.method as any, version, handler: async () => {}, authenticationRequired: false });
      const endpointConfig = this.endpoints.get(endpointKey);

      if (!endpointConfig) {
        return this.sendError(res, 404, "Endpoint not found.");
      }
      context.setEndpointConfig(endpointConfig);

      // 2. Authentication Middleware
      let apiKey: ApiKey | undefined;
      if (endpointConfig.authenticationRequired) {
        const apiKeyHeaderValue = req.headers[this.config.apiKeyHeader.toLowerCase()];
        if (!apiKeyHeaderValue || typeof apiKeyHeaderValue !== "string") {
          return this.sendError(res, 401, "API Key missing or invalid.");
        }
        apiKey = await this.apiKeyManager.getApiKey(apiKeyHeaderValue);
        if (!apiKey) {
          return this.sendError(res, 401, "Invalid or inactive API Key.");
        }
        context.setApiKey(apiKey!);
      }

      // 3. Rate Limiting
      const rateLimitKey = apiKey ? `apikey-${apiKey!.key}` : `endpoint-${endpointKey}`;
      const effectiveRateLimit = apiKey?.rateLimitOverride || endpointConfig.rateLimit || this.config.defaultRateLimit;
      this.rateLimiter.setLimit(rateLimitKey, effectiveRateLimit);

      if (!(await this.rateLimiter.check(rateLimitKey))) {
        res.setHeader("X-RateLimit-Limit", effectiveRateLimit.toString());
        res.setHeader("X-RateLimit-Remaining", (await this.rateLimiter.getRemaining(rateLimitKey)).toString());
        return this.sendError(res, 429, "Too Many Requests.");
      }
      res.setHeader("X-RateLimit-Limit", effectiveRateLimit.toString());
      res.setHeader("X-RateLimit-Remaining", (await this.rateLimiter.getRemaining(rateLimitKey)).toString());

      // 4. Request Transformation (simplified)
      let transformedReqBody = req.body;
      if (endpointConfig.schema) {
        // In a real scenario, use a validation library like Joi or Zod
        // if (!validate(transformedReqBody, endpointConfig.schema)) {
        //   return this.sendError(res, 400, "Request body validation failed.");
        // }
              }

      // 5. Circuit Breaker & Retry Logic for external calls (example)
      const externalServiceCircuitBreaker = this.circuitBreakers.get("external-service-A");
      const externalServiceRetryLogic = this.retryLogics.get("external-service-A");

      let handlerResult: any;
      if (externalServiceCircuitBreaker && externalServiceRetryLogic) {
        handlerResult = await externalServiceRetryLogic.execute(() =>
          externalServiceCircuitBreaker.execute(() => endpointConfig.handler(req, res))
        );
      } else {
        handlerResult = await endpointConfig.handler(req, res);
      }

      // 6. Response Transformation (simplified)
      if (endpointConfig.responseSchema) {
        // In a real scenario, transform/validate response
              }

      // 7. Webhook Management (trigger events post-successful response)
      if (endpointConfig.webhookEvents && endpointConfig.webhookEvents.length > 0) {
        for (const event of endpointConfig.webhookEvents) {
          await this.webhookManager.publish(event, { ...handlerResult, requestId: context.requestId });
        }
      }

      // 8. Usage Analytics
      const latency = Date.now() - startTime;
      await this.usageAnalytics.recordUsage(context.apiKey?.key || "anonymous", endpointKey, res.statusCode || 200, latency);

    } catch (error: any) {
            const latency = Date.now() - startTime;
      await this.usageAnalytics.recordUsage(context.apiKey?.key || "anonymous", context.endpointConfig?.path || "unknown", res.statusCode || 500, latency);
      this.sendError(res, error.statusCode || 500, error.message || "Internal Server Error");
    }
  }

  private sendError(res: Response, statusCode: number, message: string): void {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: message }));
  }

  // Public methods for managing API keys, webhooks, and documentation
  public getApiKeyManager(): ApiKeyManager {
    return this.apiKeyManager;
  }

  public getWebhookManager(): WebhookManager {
    return this.webhookManager;
  }

  public getUsageAnalytics(): UsageAnalytics {
    return this.usageAnalytics;
  }

  public getDocumentationGenerator(): ApiDocumentationGenerator {
    return this.documentationGenerator;
  }

  public async generateApiDocs(format: "openapi" | "markdown"): Promise<object | string> {
    if (format === "openapi") {
      return this.documentationGenerator.generateOpenApiSpec();
    } else if (format === "markdown") {
      return this.documentationGenerator.generateMarkdownDocs();
    }
    throw new Error("Unsupported documentation format.");
  }
}

// In a real Node.js environment, these would be from Express.Request and Express.Response
interface Request {
  url: string;
  method: string;
  headers: { [key: string]: string | string[] | undefined };
  body?: any;
}

interface Response {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(data: string): void;
}

// --- Constants ---
const DEFAULT_API_GATEWAY_CONFIG: ApiGatewayConfig = {
  port: 3000,
  apiPrefix: "/api",
  defaultRateLimit: 100,
  apiKeyHeader: "X-API-Key",
  webhookSecret: "default-webhook-secret-123",
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelayMs: 1000, // 1 second
};

// --- Singleton Instance ---
const nexusApiGatewayEngine = new NexusApiGatewayEngine(DEFAULT_API_GATEWAY_CONFIG);

// --- Example Usage / Endpoint Registration (for demonstration) ---
// In a real application, endpoints would be registered dynamically or via configuration
nexusApiGatewayEngine.registerEndpoint({
  path: "/users",
  method: "GET",
  version: "1",
  authenticationRequired: true,
  rateLimit: 50,
  handler: async (req, res) => {
    // Simulate fetching users from a database
    const users = [{ id: "1", name: "Alice" }, { id: "2", name: "Bob" }];
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(users));
  },
  responseSchema: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } } },
});

nexusApiGatewayEngine.registerEndpoint({
  path: "/users",
  method: "POST",
  version: "1",
  authenticationRequired: true,
  handler: async (req, res) => {
    // Simulate creating a user
    const newUser = { id: `user-${Date.now()}`, ...req.body };
    res.statusCode = 201;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(newUser));
    // Publish webhook event
    await nexusApiGatewayEngine.getWebhookManager().publish("user.created", newUser);
  },
  schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
  webhookEvents: ["user.created"],
});

nexusApiGatewayEngine.registerEndpoint({
  path: "/data/public",
  method: "GET",
  version: "1",
  authenticationRequired: false,
  handler: async (req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "This is public data." }));
  },
});

// --- Exports ---
export { NexusApiGatewayEngine, ApiGatewayConfig, EndpointConfig, WebhookSubscription, ApiKey, UsageRecord };
export default nexusApiGatewayEngine;
