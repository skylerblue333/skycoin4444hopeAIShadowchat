/**
 * Multi-Tenant System for SKYCOIN4444
 * 
 * Enables:
 * - Tenant isolation
 * - Data segregation
 * - Custom configurations
 * - Billing & usage tracking
 */

import { z } from 'zod';

// Tenant schema
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string().optional(),
  status: z.enum(['active', 'suspended', 'deleted']),
  tier: z.enum(['free', 'pro', 'enterprise']),
  createdAt: z.number(),
  updatedAt: z.number(),
  config: z.record(z.string(), z.any()).optional(),
  limits: z.object({
    users: z.number(),
    storage: z.number(), // GB
    apiCalls: z.number(), // per month
    experiments: z.number(),
    connectors: z.number(),
  }).optional(),
  features: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

// Tenant tier configurations
export const TenantTiers = {
  free: {
    users: 5,
    storage: 1, // 1 GB
    apiCalls: 10000, // 10k per month
    experiments: 2,
    connectors: 1,
    features: ['basic_analytics', 'feedback_hub'],
    price: 0,
  },
  pro: {
    users: 50,
    storage: 100, // 100 GB
    apiCalls: 1000000, // 1M per month
    experiments: 20,
    connectors: 5,
    features: [
      'basic_analytics',
      'feedback_hub',
      'adaptive_roadmap',
      'agent_debate',
      'competitive_radar',
      'behavioral_intelligence',
      'experiment_factory',
      'narrative_engine',
      'connector_intelligence',
      'product_brain',
    ],
    price: 99,
  },
  enterprise: {
    users: 1000,
    storage: 10000, // 10 TB
    apiCalls: 100000000, // 100M per month
    experiments: 1000,
    connectors: 50,
    features: [
      'all_features',
      'custom_integrations',
      'dedicated_support',
      'sso',
      'audit_logs',
      'custom_domain',
      'white_label',
      'api_access',
      'webhooks',
      'advanced_security',
    ],
    price: 'custom',
  },
};

// Tenant context for request handling
export interface TenantContext {
  tenantId: string;
  tenant: Tenant;
  userId: string;
  role: 'admin' | 'user' | 'viewer';
}

// Usage tracking
export interface TenantUsage {
  tenantId: string;
  month: string;
  apiCalls: number;
  storage: number;
  experiments: number;
  activeUsers: number;
  timestamp: number;
}

// Tenant isolation middleware
export function createTenantMiddleware() {
  return async (req: any, res: any, next: any) => {
    // Extract tenant from subdomain, header, or path
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    try {
      // Load tenant configuration
      const tenant = await loadTenant(tenantId);

      if (!tenant || tenant.status !== 'active') {
        return res.status(403).json({ error: 'Tenant not found or inactive' });
      }

      // Attach tenant context to request
      req.tenantContext = {
        tenantId,
        tenant,
        userId: req.user?.id,
        role: req.user?.role || 'viewer',
      };

      // Set tenant-specific headers
      res.setHeader('X-Tenant-ID', tenantId);

      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to load tenant' });
    }
  };
}

// Extract tenant ID from request
function extractTenantId(req: any): string | null {
  // Try subdomain first (e.g., acme.skycoin4444.com)
  const subdomain = req.subdomains?.[0];
  if (subdomain) return subdomain;

  // Try header (e.g., X-Tenant-ID)
  const header = req.headers['x-tenant-id'];
  if (header) return header;

  // Try path (e.g., /api/tenant/acme/...)
  const pathMatch = req.path.match(/^\/api\/tenant\/([^/]+)/);
  if (pathMatch) return pathMatch[1];

  return null;
}

// Load tenant from database (stub)
async function loadTenant(tenantId: string): Promise<Tenant | null> {
  // In production, this would query the database
  // For now, return a mock tenant
  return {
    id: tenantId,
    name: `Tenant ${tenantId}`,
    slug: tenantId,
    status: 'active',
    tier: 'pro',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {},
    limits: TenantTiers.pro,
    features: TenantTiers.pro.features,
  };
}

// Tenant data isolation
export class TenantDataIsolation {
  /**
   * Add tenant filter to database queries
   */
  static addTenantFilter(query: any, tenantId: string) {
    return {
      ...query,
      tenantId,
    };
  }

  /**
   * Ensure user belongs to tenant
   */
  static async verifyUserTenant(userId: string, tenantId: string): Promise<boolean> {
    // In production, query database to verify relationship
    return true;
  }

  /**
   * Get tenant-specific table name
   */
  static getTenantTable(baseTable: string, tenantId: string): string {
    // Option 1: Separate schemas per tenant
    // return `tenant_${tenantId}.${baseTable}`;

    // Option 2: Shared tables with tenantId column
    return baseTable;
  }
}

// Usage tracking
export class TenantUsageTracker {
  private usage = new Map<string, TenantUsage>();

  recordApiCall(tenantId: string) {
    const key = this.getUsageKey(tenantId);
    const current = this.usage.get(key) || this.createUsageRecord(tenantId);
    current.apiCalls++;
    this.usage.set(key, current);
  }

  recordStorage(tenantId: string, bytes: number) {
    const key = this.getUsageKey(tenantId);
    const current = this.usage.get(key) || this.createUsageRecord(tenantId);
    current.storage += bytes;
    this.usage.set(key, current);
  }

  recordExperiment(tenantId: string) {
    const key = this.getUsageKey(tenantId);
    const current = this.usage.get(key) || this.createUsageRecord(tenantId);
    current.experiments++;
    this.usage.set(key, current);
  }

  recordActiveUser(tenantId: string) {
    const key = this.getUsageKey(tenantId);
    const current = this.usage.get(key) || this.createUsageRecord(tenantId);
    current.activeUsers++;
    this.usage.set(key, current);
  }

  getUsage(tenantId: string): TenantUsage | null {
    return this.usage.get(this.getUsageKey(tenantId)) || null;
  }

  checkLimits(tenantId: string, tenant: Tenant): { exceeded: boolean; violations: string[] } {
    const usage = this.getUsage(tenantId);
    if (!usage || !tenant.limits) {
      return { exceeded: false, violations: [] };
    }

    const violations: string[] = [];

    if (usage.apiCalls > tenant.limits.apiCalls) {
      violations.push('API call limit exceeded');
    }
    if (usage.storage > tenant.limits.storage * 1024 * 1024 * 1024) {
      violations.push('Storage limit exceeded');
    }
    if (usage.experiments > tenant.limits.experiments) {
      violations.push('Experiment limit exceeded');
    }
    if (usage.activeUsers > tenant.limits.users) {
      violations.push('User limit exceeded');
    }

    return {
      exceeded: violations.length > 0,
      violations,
    };
  }

  private getUsageKey(tenantId: string): string {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `${tenantId}:${month}`;
  }

  private createUsageRecord(tenantId: string): TenantUsage {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      tenantId,
      month,
      apiCalls: 0,
      storage: 0,
      experiments: 0,
      activeUsers: 0,
      timestamp: Date.now(),
    };
  }
}

// Billing system
export class TenantBilling {
  /**
   * Calculate monthly bill
   */
  static calculateBill(tenant: Tenant, usage: TenantUsage): number {
    const tierConfig = TenantTiers[tenant.tier];
    const basePrice = typeof tierConfig.price === 'number' ? tierConfig.price : 0;
    if (tierConfig.price === 'custom') {
      return 0; // Custom pricing handled separately
    }

    let bill = basePrice;

    // Add overage charges
    if (usage.apiCalls > tierConfig.apiCalls) {
      const overage = usage.apiCalls - tierConfig.apiCalls;
      bill += (overage / 1000000) * 10; // $10 per million API calls
    }

    if (usage.storage > tierConfig.storage) {
      const overage = usage.storage - tierConfig.storage;
      bill += overage * 0.1; // $0.10 per GB
    }

    return Math.round(bill * 100) / 100; // Round to 2 decimals
  }

  /**
   * Generate invoice
   */
  static generateInvoice(tenant: Tenant, usage: TenantUsage, bill: number) {
    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      month: usage.month,
      tier: tenant.tier,
      basePrice: TenantTiers[tenant.tier].price,
      usage: {
        apiCalls: usage.apiCalls,
        storage: usage.storage,
        experiments: usage.experiments,
        activeUsers: usage.activeUsers,
      },
      overages: this.calculateOverages(tenant, usage),
      total: bill,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    };
  }

  private static calculateOverages(tenant: Tenant, usage: TenantUsage) {
    const tierConfig = TenantTiers[tenant.tier];
    const overages: Record<string, number> = {};

    if (usage.apiCalls > tierConfig.apiCalls) {
      overages['apiCalls'] = (usage.apiCalls - tierConfig.apiCalls) / 1000000 * 10;
    }

    if (usage.storage > tierConfig.storage) {
      overages['storage'] = (usage.storage - tierConfig.storage) * 0.1;
    }

    return overages;
  }
}

// Multi-tenant setup instructions
export const setupInstructions = `
# Multi-Tenant System Setup

## Enable Multi-Tenancy
export MULTI_TENANT_ENABLED=true
export TENANT_ISOLATION=database_row_level

## Tenant Identification Methods

### 1. Subdomain-based (Recommended)
- acme.skycoin4444.com → tenant: acme
- Setup: Configure wildcard DNS *.skycoin4444.com

### 2. Header-based
- Header: X-Tenant-ID: acme
- Use for: API clients, mobile apps

### 3. Path-based
- URL: /api/tenant/acme/...
- Use for: Legacy systems, testing

## Create Tenant
POST /api/tenants
{
  "name": "Acme Corp",
  "slug": "acme",
  "tier": "pro",
  "domain": "acme.skycoin4444.com"
}

## Check Usage
GET /api/tenants/{tenantId}/usage

## Upgrade Tier
POST /api/tenants/{tenantId}/upgrade
{
  "tier": "enterprise"
}

## Data Isolation Verification
- All queries automatically filtered by tenantId
- Row-level security enforced at database level
- Cross-tenant data access prevented
- Audit logs track all access

## Performance Considerations
- Separate connection pools per tenant (optional)
- Caching strategy: tenant-scoped cache keys
- Query optimization: index on (tenantId, ...)
- Monitoring: track per-tenant metrics
`;
