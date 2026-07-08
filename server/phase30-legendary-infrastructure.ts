import crypto from 'crypto';
/**
 * PHASE 30 — LEGENDARY INFRASTRUCTURE
 * Multi-Region Orchestration, Auto-Sharding, Cost Intelligence,
 * Traffic Management, Capacity Planning, SLA Monitoring,
 * Disaster Recovery, Data Sovereignty, Edge Computing,
 * Infrastructure as Code, Observability, Incident Intelligence
 * Goal: Scale to 100M users without rewriting anything.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RegionStatus = "healthy" | "degraded" | "critical" | "offline" | "maintenance";
export type ShardStatus = "active" | "rebalancing" | "migrating" | "readonly" | "offline";
export type TrafficPolicy = "round_robin" | "least_connections" | "latency_based" | "geo_affinity" | "weighted";
export type IncidentSeverity = "p0" | "p1" | "p2" | "p3" | "p4";
export type IncidentStatus = "detected" | "acknowledged" | "investigating" | "mitigating" | "resolved" | "post_mortem";
export type CostCategory = "compute" | "storage" | "bandwidth" | "database" | "cdn" | "ai" | "monitoring" | "other";

export interface Region {
  id: string;
  name: string;
  provider: "aws" | "gcp" | "azure" | "cloudflare" | "hetzner";
  zone: string;
  status: RegionStatus;
  isPrimary: boolean;
  isEdge: boolean;
  latencyMs: number;
  cpuUtilization: number; // 0-100
  memoryUtilization: number; // 0-100
  diskUtilization: number; // 0-100
  networkInMbps: number;
  networkOutMbps: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number; // 0-1
  p99LatencyMs: number;
  lastHealthCheck: Date;
  dataSovereignty: string[]; // country codes that must stay in this region
  createdAt: Date;
}

export interface Shard {
  id: string;
  shardKey: string;
  shardType: "user" | "content" | "wallet" | "analytics" | "media";
  regionId: string;
  status: ShardStatus;
  minKey: string;
  maxKey: string;
  recordCount: number;
  sizeBytes: number;
  replicaIds: string[];
  isPrimary: boolean;
  replicationLag: number; // ms
  writeQPS: number;
  readQPS: number;
  lastRebalanceAt?: Date;
  createdAt: Date;
}

export interface TrafficRoute {
  id: string;
  serviceName: string;
  policy: TrafficPolicy;
  regionWeights: Record<string, number>; // regionId -> weight (0-100)
  healthCheckPath: string;
  healthCheckIntervalMs: number;
  failoverRegionId?: string;
  stickySessionEnabled: boolean;
  rateLimitRPS?: number;
  circuitBreakerThreshold?: number; // error rate 0-1
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacityPlan {
  id: string;
  regionId: string;
  planType: "scale_up" | "scale_down" | "scale_out" | "scale_in" | "migrate";
  trigger: "manual" | "auto_cpu" | "auto_memory" | "auto_rps" | "scheduled";
  currentCapacity: number;
  targetCapacity: number;
  estimatedCostDelta: number; // USD/month
  estimatedLatencyImpact: number; // ms
  scheduledAt?: Date;
  executedAt?: Date;
  status: "planned" | "approved" | "executing" | "completed" | "rolled_back";
  approvedBy?: number;
  createdAt: Date;
}

export interface SLATarget {
  id: string;
  serviceName: string;
  metric: "availability" | "latency_p99" | "error_rate" | "throughput";
  target: number;
  unit: string;
  measurementWindow: "1m" | "5m" | "1h" | "24h" | "30d";
  currentValue: number;
  isBreached: boolean;
  breachCount: number;
  lastBreachAt?: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: string[];
  affectedRegions: string[];
  detectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  mttrMinutes?: number; // mean time to resolve
  rootCause?: string;
  timeline: Array<{
    timestamp: Date;
    action: string;
    performedBy?: number;
    isAutomatic: boolean;
  }>;
  impactedUsers: number;
  postMortemUrl?: string;
  createdAt: Date;
}

export interface CostRecord {
  id: string;
  regionId?: string;
  serviceName: string;
  category: CostCategory;
  amount: number;
  currency: string;
  period: string; // YYYY-MM
  usageUnits: number;
  unitType: string;
  tags: Record<string, string>;
  createdAt: Date;
}

export interface CostOptimization {
  id: string;
  title: string;
  description: string;
  category: CostCategory;
  currentMonthlyCost: number;
  projectedSavings: number;
  savingsPercent: number;
  effort: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  status: "identified" | "approved" | "implementing" | "completed" | "rejected";
  implementedAt?: Date;
  createdAt: Date;
}

export interface EdgeNode {
  id: string;
  regionId: string;
  location: string; // city, country
  status: RegionStatus;
  cachedAssets: number;
  cacheHitRate: number; // 0-1
  requestsPerSecond: number;
  bandwidthMbps: number;
  latencyToOriginMs: number;
  lastSyncAt: Date;
  createdAt: Date;
}

export interface DataSovereigntyPolicy {
  id: string;
  countryCode: string;
  dataTypes: Array<"user_pii" | "financial" | "health" | "content" | "analytics">;
  allowedRegionIds: string[];
  encryptionRequired: boolean;
  retentionDays: number;
  rightToErasureEnabled: boolean;
  auditLoggingRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObservabilityMetric {
  id: string;
  serviceName: string;
  regionId?: string;
  metricName: string;
  value: number;
  unit: string;
  labels: Record<string, string>;
  timestamp: Date;
}

export interface InfrastructureAlert {
  id: string;
  alertName: string;
  severity: "info" | "warning" | "critical";
  serviceName: string;
  regionId?: string;
  condition: string;
  currentValue: number;
  threshold: number;
  message: string;
  isActive: boolean;
  firedAt: Date;
  resolvedAt?: Date;
  incidentId?: string;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _regions = new Map<string, Region>();
const _shards = new Map<string, Shard>();
const _trafficRoutes = new Map<string, TrafficRoute>();
const _capacityPlans = new Map<string, CapacityPlan>();
const _slaTargets = new Map<string, SLATarget>();
const _incidents = new Map<string, Incident>();
const _costRecords = new Map<string, CostRecord>();
const _costOptimizations = new Map<string, CostOptimization>();
const _edgeNodes = new Map<string, EdgeNode>();
const _sovereigntyPolicies = new Map<string, DataSovereigntyPolicy>();
const _metrics: ObservabilityMetric[] = [];
const _alerts = new Map<string, InfrastructureAlert>();

// ─── REGION MANAGER ───────────────────────────────────────────────────────────

export const regionManager = {
  addRegion(params: Omit<Region, "lastHealthCheck" | "createdAt">): Region {
    const region: Region = {
      ...params,
      lastHealthCheck: new Date(),
      createdAt: new Date(),
    };
    _regions.set(region.id, region);
    return region;
  },

  updateHealth(regionId: string, metrics: Partial<Pick<Region, "cpuUtilization" | "memoryUtilization" | "diskUtilization" | "networkInMbps" | "networkOutMbps" | "activeConnections" | "requestsPerSecond" | "errorRate" | "p99LatencyMs" | "latencyMs">>): Region | null {
    const region = _regions.get(regionId);
    if (!region) return null;
    Object.assign(region, metrics);
    region.lastHealthCheck = new Date();

    // Auto-determine status
    if (region.errorRate > 0.1 || region.cpuUtilization > 95) region.status = "critical";
    else if (region.errorRate > 0.05 || region.cpuUtilization > 80) region.status = "degraded";
    else region.status = "healthy";

    // Fire alerts if needed
    if (region.cpuUtilization > 90) {
      this._fireAlert(`cpu_${regionId}`, "CPU Critical", "critical", `region-${regionId}`, regionId, `CPU > 90%`, region.cpuUtilization, 90);
    }
    if (region.errorRate > 0.05) {
      this._fireAlert(`err_${regionId}`, "High Error Rate", "critical", `region-${regionId}`, regionId, `Error rate > 5%`, region.errorRate * 100, 5);
    }

    return region;
  },

  _fireAlert(id: string, name: string, severity: InfrastructureAlert["severity"], service: string, regionId: string, condition: string, current: number, threshold: number): void {
    const existing = _alerts.get(id);
    if (existing && existing.isActive) return;
    const alert: InfrastructureAlert = {
      id,
      alertName: name,
      severity,
      serviceName: service,
      regionId,
      condition,
      currentValue: current,
      threshold,
      message: `${name}: ${current.toFixed(1)} exceeds threshold ${threshold}`,
      isActive: true,
      firedAt: new Date(),
    };
    _alerts.set(id, alert);
  },

  getRegion(id: string): Region | null {
    return _regions.get(id) ?? null;
  },

  getAllRegions(): Region[] {
    return Array.from(_regions.values()).sort((a, b) => (a.isPrimary ? -1 : 1) - (b.isPrimary ? -1 : 1));
  },

  getHealthyRegions(): Region[] {
    return Array.from(_regions.values()).filter(r => r.status === "healthy");
  },

  getRegionStatus(): Record<string, RegionStatus> {
    const result: Record<string, RegionStatus> = {};
    for (const r of _regions.values()) result[r.id] = r.status;
    return result;
  },

  failoverRegion(fromRegionId: string, toRegionId: string): { success: boolean; affectedRoutes: string[] } {
    const from = _regions.get(fromRegionId);
    const to = _regions.get(toRegionId);
    if (!from || !to) return { success: false, affectedRoutes: [] };

    from.status = "offline";
    const affectedRoutes: string[] = [];

    for (const route of _trafficRoutes.values()) {
      if (route.regionWeights[fromRegionId] !== undefined) {
        const weight = route.regionWeights[fromRegionId];
        delete route.regionWeights[fromRegionId];
        route.regionWeights[toRegionId] = (route.regionWeights[toRegionId] ?? 0) + weight;
        route.updatedAt = new Date();
        affectedRoutes.push(route.id);
      }
    }

    return { success: true, affectedRoutes };
  },
};

// ─── SHARD MANAGER ───────────────────────────────────────────────────────────

export const shardManager = {
  createShard(params: Omit<Shard, "createdAt">): Shard {
    const shard: Shard = { ...params, createdAt: new Date() };
    _shards.set(shard.id, shard);
    return shard;
  },

  getShardForKey(shardType: Shard["shardType"], key: string): Shard | null {
    const shards = Array.from(_shards.values()).filter(s => s.shardType === shardType && s.status === "active" && s.isPrimary);
    for (const shard of shards) {
      if (key >= shard.minKey && key <= shard.maxKey) return shard;
    }
    return shards[0] ?? null;
  },

  rebalanceShards(shardType: Shard["shardType"]): { moved: number; plans: CapacityPlan[] } {
    const shards = Array.from(_shards.values()).filter(s => s.shardType === shardType && s.isPrimary);
    const plans: CapacityPlan[] = [];
    let moved = 0;

    // Find overloaded shards (>80% of avg)
    const avgRecords = shards.reduce((s, sh) => s + sh.recordCount, 0) / Math.max(1, shards.length);
    for (const shard of shards) {
      if (shard.recordCount > avgRecords * 1.5) {
        const planId = `cap_${shard.id}_${Date.now()}`;
        const plan: CapacityPlan = {
          id: planId,
          regionId: shard.regionId,
          planType: "scale_out",
          trigger: "auto_rps",
          currentCapacity: shard.recordCount,
          targetCapacity: Math.floor(avgRecords),
          estimatedCostDelta: 50,
          estimatedLatencyImpact: -5,
          status: "planned",
          createdAt: new Date(),
        };
        _capacityPlans.set(planId, plan);
        plans.push(plan);
        shard.status = "rebalancing";
        shard.lastRebalanceAt = new Date();
        moved++;
      }
    }

    return { moved, plans };
  },

  updateShardMetrics(shardId: string, metrics: Partial<Pick<Shard, "recordCount" | "sizeBytes" | "writeQPS" | "readQPS" | "replicationLag">>): Shard | null {
    const shard = _shards.get(shardId);
    if (!shard) return null;
    Object.assign(shard, metrics);
    return shard;
  },

  getShardStats(): { totalShards: number; byType: Record<string, number>; totalRecords: number; totalSizeGB: number } {
    const shards = Array.from(_shards.values());
    const byType: Record<string, number> = {};
    let totalRecords = 0;
    let totalSizeBytes = 0;
    for (const s of shards) {
      byType[s.shardType] = (byType[s.shardType] ?? 0) + 1;
      totalRecords += s.recordCount;
      totalSizeBytes += s.sizeBytes;
    }
    return { totalShards: shards.length, byType, totalRecords, totalSizeGB: totalSizeBytes / (1024 ** 3) };
  },
};

// ─── TRAFFIC MANAGER ─────────────────────────────────────────────────────────

export const trafficManager = {
  createRoute(params: Omit<TrafficRoute, "id" | "createdAt" | "updatedAt">): TrafficRoute {
    const id = `route_${params.serviceName}_${Date.now()}`;
    const route: TrafficRoute = { ...params, id, createdAt: new Date(), updatedAt: new Date() };
    _trafficRoutes.set(id, route);
    return route;
  },

  updateWeights(routeId: string, weights: Record<string, number>): TrafficRoute | null {
    const route = _trafficRoutes.get(routeId);
    if (!route) return null;
    // Normalize weights to sum to 100
    const total = Object.values(weights).reduce((s, w) => s + w, 0);
    for (const [regionId, weight] of Object.entries(weights)) {
      route.regionWeights[regionId] = total > 0 ? (weight / total) * 100 : 0;
    }
    route.updatedAt = new Date();
    return route;
  },

  getRouteForService(serviceName: string): TrafficRoute | null {
    return Array.from(_trafficRoutes.values()).find(r => r.serviceName === serviceName && r.isActive) ?? null;
  },

  selectRegion(serviceName: string): string | null {
    const route = this.getRouteForService(serviceName);
    if (!route) return null;

    const healthyRegions = regionManager.getHealthyRegions().map(r => r.id);
    const eligibleWeights = Object.entries(route.regionWeights)
      .filter(([regionId]) => healthyRegions.includes(regionId));

    if (eligibleWeights.length === 0) return route.failoverRegionId ?? null;

    // Weighted random selection
    const total = eligibleWeights.reduce((s, [, w]) => s + w, 0);
    let rand = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * total;
    for (const [regionId, weight] of eligibleWeights) {
      rand -= weight;
      if (rand <= 0) return regionId;
    }
    return eligibleWeights[0]?.[0] ?? null;
  },

  getTrafficStats(): { totalRoutes: number; activeRoutes: number; byPolicy: Record<string, number> } {
    const routes = Array.from(_trafficRoutes.values());
    const byPolicy: Record<string, number> = {};
    for (const r of routes) byPolicy[r.policy] = (byPolicy[r.policy] ?? 0) + 1;
    return { totalRoutes: routes.length, activeRoutes: routes.filter(r => r.isActive).length, byPolicy };
  },
};

// ─── SLA MONITOR ─────────────────────────────────────────────────────────────

export const slaMonitor = {
  createTarget(params: Omit<SLATarget, "currentValue" | "isBreached" | "breachCount" | "updatedAt">): SLATarget {
    const target: SLATarget = {
      ...params,
      currentValue: 0,
      isBreached: false,
      breachCount: 0,
      updatedAt: new Date(),
    };
    _slaTargets.set(target.id, target);
    return target;
  },

  updateMetric(targetId: string, currentValue: number): SLATarget | null {
    const target = _slaTargets.get(targetId);
    if (!target) return null;
    target.currentValue = currentValue;
    const wasBreached = target.isBreached;

    // Check breach: for availability/throughput higher is better; for latency/error_rate lower is better
    const higherIsBetter = target.metric === "availability" || target.metric === "throughput";
    target.isBreached = higherIsBetter ? currentValue < target.target : currentValue > target.target;

    if (target.isBreached && !wasBreached) {
      target.breachCount++;
      target.lastBreachAt = new Date();
    }
    target.updatedAt = new Date();
    return target;
  },

  getSLAReport(): {
    totalTargets: number;
    breachedTargets: number;
    overallHealth: number;
    byService: Record<string, { breached: boolean; value: number; target: number }>;
  } {
    const targets = Array.from(_slaTargets.values());
    const breached = targets.filter(t => t.isBreached);
    const byService: Record<string, { breached: boolean; value: number; target: number }> = {};
    for (const t of targets) {
      byService[`${t.serviceName}_${t.metric}`] = { breached: t.isBreached, value: t.currentValue, target: t.target };
    }
    return {
      totalTargets: targets.length,
      breachedTargets: breached.length,
      overallHealth: targets.length > 0 ? (targets.length - breached.length) / targets.length : 1,
      byService,
    };
  },

  getTarget(id: string): SLATarget | null {
    return _slaTargets.get(id) ?? null;
  },
};

// ─── INCIDENT MANAGER ────────────────────────────────────────────────────────

export const incidentManager = {
  createIncident(params: Omit<Incident, "id" | "timeline" | "createdAt">): Incident {
    const id = `inc_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const incident: Incident = {
      ...params,
      id,
      timeline: [{
        timestamp: params.detectedAt,
        action: "Incident detected",
        isAutomatic: true,
      }],
      createdAt: new Date(),
    };
    _incidents.set(id, incident);
    return incident;
  },

  acknowledge(incidentId: string, userId: number): Incident | null {
    const incident = _incidents.get(incidentId);
    if (!incident || incident.status !== "detected") return null;
    incident.status = "acknowledged";
    incident.acknowledgedAt = new Date();
    incident.timeline.push({ timestamp: new Date(), action: `Acknowledged by user ${userId}`, performedBy: userId, isAutomatic: false });
    return incident;
  },

  updateStatus(incidentId: string, status: IncidentStatus, action: string, userId?: number): Incident | null {
    const incident = _incidents.get(incidentId);
    if (!incident) return null;
    incident.status = status;
    if (status === "resolved") {
      incident.resolvedAt = new Date();
      incident.mttrMinutes = Math.round((incident.resolvedAt.getTime() - incident.detectedAt.getTime()) / 60000);
    }
    incident.timeline.push({ timestamp: new Date(), action, performedBy: userId, isAutomatic: !userId });
    return incident;
  },

  getActiveIncidents(severity?: IncidentSeverity): Incident[] {
    return Array.from(_incidents.values())
      .filter(i => !["resolved", "post_mortem"].includes(i.status) && (!severity || i.severity === severity))
      .sort((a, b) => {
        const order = { p0: 0, p1: 1, p2: 2, p3: 3, p4: 4 };
        return order[a.severity] - order[b.severity];
      });
  },

  getIncident(id: string): Incident | null {
    return _incidents.get(id) ?? null;
  },

  getMTTR(days = 30): number {
    const cutoff = new Date(Date.now() - days * 86400000);
    const resolved = Array.from(_incidents.values())
      .filter(i => i.status === "resolved" && i.resolvedAt && i.resolvedAt >= cutoff && i.mttrMinutes !== undefined);
    if (resolved.length === 0) return 0;
    return resolved.reduce((s, i) => s + (i.mttrMinutes ?? 0), 0) / resolved.length;
  },
};

// ─── COST INTELLIGENCE ENGINE ────────────────────────────────────────────────

export const costIntelligenceEngine = {
  recordCost(params: Omit<CostRecord, "id" | "createdAt">): CostRecord {
    const id = `cost_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const record: CostRecord = { ...params, id, createdAt: new Date() };
    _costRecords.set(id, record);
    return record;
  },

  getCostReport(period?: string): {
    total: number;
    byCategory: Record<string, number>;
    byRegion: Record<string, number>;
    byService: Record<string, number>;
    trend: "increasing" | "stable" | "decreasing";
  } {
    const records = Array.from(_costRecords.values()).filter(r => !period || r.period === period);
    const byCategory: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let total = 0;

    for (const r of records) {
      total += r.amount;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount;
      if (r.regionId) byRegion[r.regionId] = (byRegion[r.regionId] ?? 0) + r.amount;
      byService[r.serviceName] = (byService[r.serviceName] ?? 0) + r.amount;
    }

    // Simple trend: compare last 2 periods
    const periods = [...new Set(Array.from(_costRecords.values()).map(r => r.period))].sort();
    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (periods.length >= 2) {
      const lastPeriod = periods[periods.length - 1];
      const prevPeriod = periods[periods.length - 2];
      const lastTotal = Array.from(_costRecords.values()).filter(r => r.period === lastPeriod).reduce((s, r) => s + r.amount, 0);
      const prevTotal = Array.from(_costRecords.values()).filter(r => r.period === prevPeriod).reduce((s, r) => s + r.amount, 0);
      if (lastTotal > prevTotal * 1.05) trend = "increasing";
      else if (lastTotal < prevTotal * 0.95) trend = "decreasing";
    }

    return { total, byCategory, byRegion, byService, trend };
  },

  identifyOptimizations(): CostOptimization[] {
    const report = this.getCostReport();
    const optimizations: CostOptimization[] = [];

    // Identify top cost categories
    for (const [category, amount] of Object.entries(report.byCategory)) {
      if (amount > 1000) {
        const id = `opt_${category}_${Date.now()}`;
        const opt: CostOptimization = {
          id,
          title: `Optimize ${category} costs`,
          description: `${category} spending is $${amount.toFixed(0)}/month. Potential for optimization.`,
          category: category as CostCategory,
          currentMonthlyCost: amount,
          projectedSavings: amount * 0.2,
          savingsPercent: 20,
          effort: amount > 10000 ? "high" : "medium",
          risk: "low",
          status: "identified",
          createdAt: new Date(),
        };
        _costOptimizations.set(id, opt);
        optimizations.push(opt);
      }
    }

    return optimizations;
  },

  approveOptimization(optimizationId: string, approvedBy: number): CostOptimization | null {
    const opt = _costOptimizations.get(optimizationId);
    if (!opt || opt.status !== "identified") return null;
    opt.status = "approved";
    return opt;
  },

  implementOptimization(optimizationId: string): CostOptimization | null {
    const opt = _costOptimizations.get(optimizationId);
    if (!opt || opt.status !== "approved") return null;
    opt.status = "completed";
    opt.implementedAt = new Date();
    return opt;
  },

  getTotalMonthlyCost(): number {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    return Array.from(_costRecords.values())
      .filter(r => r.period === currentPeriod)
      .reduce((s, r) => s + r.amount, 0);
  },
};

// ─── EDGE COMPUTING ENGINE ────────────────────────────────────────────────────

export const edgeComputingEngine = {
  addEdgeNode(params: Omit<EdgeNode, "createdAt">): EdgeNode {
    const node: EdgeNode = { ...params, createdAt: new Date() };
    _edgeNodes.set(node.id, node);
    return node;
  },

  updateEdgeMetrics(nodeId: string, metrics: Partial<Pick<EdgeNode, "cachedAssets" | "cacheHitRate" | "requestsPerSecond" | "bandwidthMbps" | "latencyToOriginMs">>): EdgeNode | null {
    const node = _edgeNodes.get(nodeId);
    if (!node) return null;
    Object.assign(node, metrics, { lastSyncAt: new Date() });
    return node;
  },

  getNearestEdgeNode(userRegion: string): EdgeNode | null {
    const nodes = Array.from(_edgeNodes.values()).filter(n => n.status === "healthy");
    if (nodes.length === 0) return null;
    // Simple: find node in same region or lowest latency
    return nodes.find(n => n.regionId === userRegion) ?? nodes.sort((a, b) => a.latencyToOriginMs - b.latencyToOriginMs)[0] ?? null;
  },

  getEdgeStats(): { totalNodes: number; avgCacheHitRate: number; totalBandwidthMbps: number } {
    const nodes = Array.from(_edgeNodes.values());
    return {
      totalNodes: nodes.length,
      avgCacheHitRate: nodes.length > 0 ? nodes.reduce((s, n) => s + n.cacheHitRate, 0) / nodes.length : 0,
      totalBandwidthMbps: nodes.reduce((s, n) => s + n.bandwidthMbps, 0),
    };
  },
};

// ─── DATA SOVEREIGNTY ENGINE ─────────────────────────────────────────────────

export const dataSovereigntyEngine = {
  createPolicy(params: Omit<DataSovereigntyPolicy, "id" | "createdAt" | "updatedAt">): DataSovereigntyPolicy {
    const id = `dsp_${params.countryCode}`;
    const policy: DataSovereigntyPolicy = { ...params, id, createdAt: new Date(), updatedAt: new Date() };
    _sovereigntyPolicies.set(id, policy);
    return policy;
  },

  getPolicy(countryCode: string): DataSovereigntyPolicy | null {
    return _sovereigntyPolicies.get(`dsp_${countryCode}`) ?? null;
  },

  validateDataPlacement(countryCode: string, regionId: string, dataType: DataSovereigntyPolicy["dataTypes"][number]): {
    isCompliant: boolean;
    reason?: string;
  } {
    const policy = this.getPolicy(countryCode);
    if (!policy) return { isCompliant: true };
    if (!policy.dataTypes.includes(dataType)) return { isCompliant: true };
    if (!policy.allowedRegionIds.includes(regionId)) {
      return { isCompliant: false, reason: `${dataType} data for ${countryCode} must be stored in: ${policy.allowedRegionIds.join(", ")}` };
    }
    return { isCompliant: true };
  },

  getAllPolicies(): DataSovereigntyPolicy[] {
    return Array.from(_sovereigntyPolicies.values());
  },
};

// ─── OBSERVABILITY ENGINE ─────────────────────────────────────────────────────

export const observabilityEngine = {
  recordMetric(params: Omit<ObservabilityMetric, "id">): ObservabilityMetric {
    const id = `metric_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const metric: ObservabilityMetric = { ...params, id };
    _metrics.push(metric);
    return metric;
  },

  queryMetrics(serviceName: string, metricName: string, since: Date): ObservabilityMetric[] {
    return _metrics.filter(m => m.serviceName === serviceName && m.metricName === metricName && m.timestamp >= since);
  },

  getActiveAlerts(severity?: InfrastructureAlert["severity"]): InfrastructureAlert[] {
    return Array.from(_alerts.values())
      .filter(a => a.isActive && (!severity || a.severity === severity))
      .sort((a, b) => b.firedAt.getTime() - a.firedAt.getTime());
  },

  resolveAlert(alertId: string): InfrastructureAlert | null {
    const alert = _alerts.get(alertId);
    if (!alert) return null;
    alert.isActive = false;
    alert.resolvedAt = new Date();
    return alert;
  },

  getObservabilityDashboard(): {
    totalMetrics: number;
    activeAlerts: number;
    criticalAlerts: number;
    activeIncidents: number;
    slaHealth: number;
    avgRegionLatency: number;
  } {
    const regions = regionManager.getAllRegions();
    const slaReport = slaMonitor.getSLAReport();
    return {
      totalMetrics: _metrics.length,
      activeAlerts: Array.from(_alerts.values()).filter(a => a.isActive).length,
      criticalAlerts: Array.from(_alerts.values()).filter(a => a.isActive && a.severity === "critical").length,
      activeIncidents: incidentManager.getActiveIncidents().length,
      slaHealth: slaReport.overallHealth,
      avgRegionLatency: regions.length > 0 ? regions.reduce((s, r) => s + r.latencyMs, 0) / regions.length : 0,
    };
  },
};

// ─── INFRASTRUCTURE ORCHESTRATOR ─────────────────────────────────────────────

export const infrastructureOrchestrator = {
  getGlobalStatus(): {
    regions: { total: number; healthy: number; degraded: number; critical: number };
    shards: { total: number; active: number; rebalancing: number };
    incidents: { active: number; p0: number; p1: number };
    costs: { monthly: number; trend: string };
    sla: { health: number; breached: number };
    edge: { nodes: number; avgCacheHit: number };
  } {
    const regions = regionManager.getAllRegions();
    const shards = Array.from(_shards.values());
    const costReport = costIntelligenceEngine.getCostReport();
    const slaReport = slaMonitor.getSLAReport();
    const edgeStats = edgeComputingEngine.getEdgeStats();

    return {
      regions: {
        total: regions.length,
        healthy: regions.filter(r => r.status === "healthy").length,
        degraded: regions.filter(r => r.status === "degraded").length,
        critical: regions.filter(r => r.status === "critical").length,
      },
      shards: {
        total: shards.length,
        active: shards.filter(s => s.status === "active").length,
        rebalancing: shards.filter(s => s.status === "rebalancing").length,
      },
      incidents: {
        active: incidentManager.getActiveIncidents().length,
        p0: incidentManager.getActiveIncidents("p0").length,
        p1: incidentManager.getActiveIncidents("p1").length,
      },
      costs: {
        monthly: costIntelligenceEngine.getTotalMonthlyCost(),
        trend: costReport.trend,
      },
      sla: {
        health: slaReport.overallHealth,
        breached: slaReport.breachedTargets,
      },
      edge: {
        nodes: edgeStats.totalNodes,
        avgCacheHit: edgeStats.avgCacheHitRate,
      },
    };
  },

  runHealthCheck(): {
    passed: number;
    failed: number;
    warnings: string[];
    criticalIssues: string[];
  } {
    const warnings: string[] = [];
    const criticalIssues: string[] = [];
    let passed = 0;
    let failed = 0;

    for (const region of regionManager.getAllRegions()) {
      if (region.status === "healthy") passed++;
      else if (region.status === "critical" || region.status === "offline") {
        failed++;
        criticalIssues.push(`Region ${region.name} is ${region.status}`);
      } else {
        warnings.push(`Region ${region.name} is ${region.status}`);
      }
    }

    const slaReport = slaMonitor.getSLAReport();
    if (slaReport.breachedTargets > 0) {
      warnings.push(`${slaReport.breachedTargets} SLA targets breached`);
    }

    const activeP0 = incidentManager.getActiveIncidents("p0");
    if (activeP0.length > 0) {
      criticalIssues.push(`${activeP0.length} P0 incidents active`);
    }

    return { passed, failed, warnings, criticalIssues };
  },
};
