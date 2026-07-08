import crypto from 'crypto';
/**
 * Skycoin4444 Microservices Architecture
 * 
 * This file defines the microservices structure and communication patterns
 * for scaling Skycoin4444 to enterprise scale.
 */

// ============================================================================
// SERVICE DEFINITIONS
// ============================================================================

export interface ServiceConfig {
  name: string;
  port: number;
  version: string;
  dependencies: string[];
  database?: string;
  cache?: string;
  messageQueue?: string;
  healthCheck: string;
}

export const SERVICES: Record<string, ServiceConfig> = {
  // Core Services
  AUTH_SERVICE: {
    name: 'auth-service',
    port: 3001,
    version: '1.0.0',
    dependencies: [],
    database: 'auth-db',
    cache: 'redis-auth',
    healthCheck: '/health',
  },
  
  API_GATEWAY: {
    name: 'api-gateway',
    port: 3000,
    version: '1.0.0',
    dependencies: ['auth-service', 'mining-service', 'trading-service', 'social-service'],
    healthCheck: '/health',
  },

  // Domain Services
  MINING_SERVICE: {
    name: 'mining-service',
    port: 3010,
    version: '1.0.0',
    dependencies: ['auth-service', 'notification-service'],
    database: 'mining-db',
    cache: 'redis-mining',
    messageQueue: 'mining-queue',
    healthCheck: '/health',
  },

  TRADING_SERVICE: {
    name: 'trading-service',
    port: 3011,
    version: '1.0.0',
    dependencies: ['auth-service', 'notification-service'],
    database: 'trading-db',
    cache: 'redis-trading',
    messageQueue: 'trading-queue',
    healthCheck: '/health',
  },

  SOCIAL_SERVICE: {
    name: 'social-service',
    port: 3012,
    version: '1.0.0',
    dependencies: ['auth-service', 'notification-service'],
    database: 'social-db',
    cache: 'redis-social',
    messageQueue: 'social-queue',
    healthCheck: '/health',
  },

  GAMING_SERVICE: {
    name: 'gaming-service',
    port: 3013,
    version: '1.0.0',
    dependencies: ['auth-service', 'notification-service'],
    database: 'gaming-db',
    cache: 'redis-gaming',
    messageQueue: 'gaming-queue',
    healthCheck: '/health',
  },

  MARKETPLACE_SERVICE: {
    name: 'marketplace-service',
    port: 3014,
    version: '1.0.0',
    dependencies: ['auth-service', 'notification-service', 'payment-service'],
    database: 'marketplace-db',
    cache: 'redis-marketplace',
    messageQueue: 'marketplace-queue',
    healthCheck: '/health',
  },

  GOVERNANCE_SERVICE: {
    name: 'governance-service',
    port: 3015,
    version: '1.0.0',
    dependencies: ['auth-service', 'notification-service'],
    database: 'governance-db',
    cache: 'redis-governance',
    messageQueue: 'governance-queue',
    healthCheck: '/health',
  },

  // Support Services
  NOTIFICATION_SERVICE: {
    name: 'notification-service',
    port: 3020,
    version: '1.0.0',
    dependencies: ['auth-service'],
    database: 'notification-db',
    messageQueue: 'notification-queue',
    healthCheck: '/health',
  },

  ANALYTICS_SERVICE: {
    name: 'analytics-service',
    port: 3021,
    version: '1.0.0',
    dependencies: ['auth-service'],
    database: 'analytics-db',
    cache: 'redis-analytics',
    healthCheck: '/health',
  },

  PAYMENT_SERVICE: {
    name: 'payment-service',
    port: 3022,
    version: '1.0.0',
    dependencies: ['auth-service', 'notification-service'],
    database: 'payment-db',
    cache: 'redis-payment',
    messageQueue: 'payment-queue',
    healthCheck: '/health',
  },
};

// ============================================================================
// SERVICE COMMUNICATION PATTERNS
// ============================================================================

export interface ServiceMessage {
  id: string;
  timestamp: number;
  source: string;
  destination: string;
  type: 'command' | 'event' | 'query' | 'response';
  payload: any;
  traceId: string;
  spanId: string;
}

export interface ServiceEvent {
  id: string;
  timestamp: number;
  service: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  data: any;
  version: number;
}

// Event types across services
export const DOMAIN_EVENTS = {
  // Mining events
  MINING_STARTED: 'mining.started',
  MINING_STOPPED: 'mining.stopped',
  REWARD_EARNED: 'mining.reward_earned',
  POOL_CONNECTED: 'mining.pool_connected',
  POOL_DISCONNECTED: 'mining.pool_disconnected',

  // Trading events
  ORDER_PLACED: 'trading.order_placed',
  ORDER_FILLED: 'trading.order_filled',
  ORDER_CANCELLED: 'trading.order_cancelled',
  TRADE_EXECUTED: 'trading.trade_executed',

  // Social events
  POST_CREATED: 'social.post_created',
  POST_LIKED: 'social.post_liked',
  COMMENT_ADDED: 'social.comment_added',
  USER_FOLLOWED: 'social.user_followed',

  // Gaming events
  GAME_STARTED: 'gaming.game_started',
  GAME_COMPLETED: 'gaming.game_completed',
  ACHIEVEMENT_UNLOCKED: 'gaming.achievement_unlocked',
  REWARD_CLAIMED: 'gaming.reward_claimed',

  // Marketplace events
  LISTING_CREATED: 'marketplace.listing_created',
  PURCHASE_COMPLETED: 'marketplace.purchase_completed',
  REVIEW_SUBMITTED: 'marketplace.review_submitted',

  // Governance events
  PROPOSAL_CREATED: 'governance.proposal_created',
  VOTE_CAST: 'governance.vote_cast',
  PROPOSAL_EXECUTED: 'governance.proposal_executed',

  // User events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
};

// ============================================================================
// API GATEWAY ROUTING
// ============================================================================

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  version: string;
  rateLimit?: number;
  requiresAuth: boolean;
  roles?: string[];
}

export const API_ROUTES: RouteConfig[] = [
  // Mining routes
  { path: '/mining/start', method: 'POST', service: 'mining-service', version: '1.0.0', requiresAuth: true },
  { path: '/mining/stop', method: 'POST', service: 'mining-service', version: '1.0.0', requiresAuth: true },
  { path: '/mining/status', method: 'GET', service: 'mining-service', version: '1.0.0', requiresAuth: true },
  { path: '/mining/stats', method: 'GET', service: 'mining-service', version: '1.0.0', requiresAuth: true },

  // Trading routes
  { path: '/trading/orders', method: 'GET', service: 'trading-service', version: '1.0.0', requiresAuth: true },
  { path: '/trading/orders', method: 'POST', service: 'trading-service', version: '1.0.0', requiresAuth: true },
  { path: '/trading/orders/:id', method: 'DELETE', service: 'trading-service', version: '1.0.0', requiresAuth: true },

  // Social routes
  { path: '/social/feed', method: 'GET', service: 'social-service', version: '1.0.0', requiresAuth: true },
  { path: '/social/posts', method: 'POST', service: 'social-service', version: '1.0.0', requiresAuth: true },
  { path: '/social/posts/:id/like', method: 'POST', service: 'social-service', version: '1.0.0', requiresAuth: true },

  // Gaming routes
  { path: '/gaming/games', method: 'GET', service: 'gaming-service', version: '1.0.0', requiresAuth: true },
  { path: '/gaming/games/:id/start', method: 'POST', service: 'gaming-service', version: '1.0.0', requiresAuth: true },

  // Marketplace routes
  { path: '/marketplace/listings', method: 'GET', service: 'marketplace-service', version: '1.0.0', requiresAuth: false },
  { path: '/marketplace/listings', method: 'POST', service: 'marketplace-service', version: '1.0.0', requiresAuth: true },
  { path: '/marketplace/purchases', method: 'POST', service: 'marketplace-service', version: '1.0.0', requiresAuth: true },

  // Governance routes
  { path: '/governance/proposals', method: 'GET', service: 'governance-service', version: '1.0.0', requiresAuth: true },
  { path: '/governance/proposals', method: 'POST', service: 'governance-service', version: '1.0.0', requiresAuth: true, roles: ['admin'] },
  { path: '/governance/proposals/:id/vote', method: 'POST', service: 'governance-service', version: '1.0.0', requiresAuth: true },
];

// ============================================================================
// SERVICE DISCOVERY
// ============================================================================

export interface ServiceRegistry {
  services: Map<string, ServiceInstance[]>;
  register(service: string, instance: ServiceInstance): void;
  deregister(service: string, instanceId: string): void;
  discover(service: string): ServiceInstance[];
  healthCheck(): Promise<void>;
}

export interface ServiceInstance {
  id: string;
  service: string;
  host: string;
  port: number;
  version: string;
  healthy: boolean;
  lastHeartbeat: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// CIRCUIT BREAKER PATTERN
// ============================================================================

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes before closing
  timeout: number; // Timeout in ms before retrying
  resetTimeout: number; // Time before attempting to close circuit
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState() {
    return this.state;
  }
}

// ============================================================================
// LOAD BALANCING STRATEGIES
// ============================================================================

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  RANDOM = 'random',
  WEIGHTED = 'weighted',
}

export class LoadBalancer {
  private currentIndex = 0;

  constructor(
    private instances: ServiceInstance[],
    private strategy: LoadBalancingStrategy = LoadBalancingStrategy.ROUND_ROBIN
  ) {}

  selectInstance(): ServiceInstance {
    const healthyInstances = this.instances.filter(i => i.healthy);
    if (healthyInstances.length === 0) {
      throw new Error('No healthy instances available');
    }

    switch (this.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.roundRobin(healthyInstances);
      case LoadBalancingStrategy.RANDOM:
        return this.random(healthyInstances);
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.leastConnections(healthyInstances);
      default:
        return healthyInstances[0];
    }
  }

  private roundRobin(instances: ServiceInstance[]): ServiceInstance {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex++;
    return instance;
  }

  private random(instances: ServiceInstance[]): ServiceInstance {
    return instances[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * instances.length)];
  }

  private leastConnections(instances: ServiceInstance[]): ServiceInstance {
    // In production, track active connections per instance
    return instances[0];
  }
}

// ============================================================================
// DISTRIBUTED TRACING
// ============================================================================

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

export class DistributedTracer {
  static generateTraceId(): string {
    return `${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`;
  }

  static generateSpanId(): string {
    return (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9);
  }

  static createContext(): TraceContext {
    return {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      sampled: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) < 0.1, // 10% sampling
    };
  }

  static propagateContext(context: TraceContext): TraceContext {
    return {
      ...context,
      parentSpanId: context.spanId,
      spanId: this.generateSpanId(),
    };
  }
}

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================

export interface DeploymentConfig {
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
  autoscaling: {
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
    targetMemory: number;
  };
  healthCheck: {
    initialDelaySeconds: number;
    periodSeconds: number;
    timeoutSeconds: number;
    failureThreshold: number;
  };
}

export const DEPLOYMENT_CONFIGS: Record<string, DeploymentConfig> = {
  'mining-service': {
    replicas: 3,
    resources: { cpu: '1000m', memory: '1Gi' },
    autoscaling: { minReplicas: 3, maxReplicas: 10, targetCPU: 70, targetMemory: 80 },
    healthCheck: { initialDelaySeconds: 10, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3 },
  },
  'trading-service': {
    replicas: 5,
    resources: { cpu: '2000m', memory: '2Gi' },
    autoscaling: { minReplicas: 5, maxReplicas: 20, targetCPU: 70, targetMemory: 80 },
    healthCheck: { initialDelaySeconds: 10, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3 },
  },
  'social-service': {
    replicas: 3,
    resources: { cpu: '1000m', memory: '1Gi' },
    autoscaling: { minReplicas: 3, maxReplicas: 15, targetCPU: 70, targetMemory: 80 },
    healthCheck: { initialDelaySeconds: 10, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3 },
  },
  'gaming-service': {
    replicas: 2,
    resources: { cpu: '500m', memory: '512Mi' },
    autoscaling: { minReplicas: 2, maxReplicas: 8, targetCPU: 70, targetMemory: 80 },
    healthCheck: { initialDelaySeconds: 10, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3 },
  },
};

export default {
  SERVICES,
  DOMAIN_EVENTS,
  API_ROUTES,
  DEPLOYMENT_CONFIGS,
  CircuitBreaker,
  LoadBalancer,
  DistributedTracer,
};
