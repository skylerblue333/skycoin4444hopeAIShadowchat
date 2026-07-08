import crypto from 'crypto';
/**
 * API Versioning & Backward Compatibility System
 * 
 * Ensures Skycoin4444 can evolve APIs without breaking existing clients
 */

import { Request, Response, NextFunction } from 'express';

// ============================================================================
// API VERSION MANAGEMENT
// ============================================================================

export interface APIVersion {
  version: string;
  releaseDate: Date;
  status: 'active' | 'deprecated' | 'sunset';
  deprecationDate?: Date;
  sunsetDate?: Date;
  changelog: string[];
  breakingChanges?: string[];
}

export const API_VERSIONS: Record<string, APIVersion> = {
  '1.0.0': {
    version: '1.0.0',
    releaseDate: new Date('2026-01-01'),
    status: 'active',
    changelog: [
      'Initial API release',
      'Mining endpoints',
      'Trading endpoints',
      'Social endpoints',
    ],
  },
  '1.1.0': {
    version: '1.1.0',
    releaseDate: new Date('2026-03-01'),
    status: 'active',
    changelog: [
      'Added gaming endpoints',
      'Added marketplace endpoints',
      'Improved error messages',
      'Added rate limiting',
    ],
  },
  '2.0.0': {
    version: '2.0.0',
    releaseDate: new Date('2026-06-01'),
    status: 'active',
    changelog: [
      'Added governance endpoints',
      'Redesigned response format',
      'Added pagination to list endpoints',
      'Improved authentication',
    ],
    breakingChanges: [
      'Response format changed from array to object with data/meta',
      'Pagination now required for list endpoints',
      'Authentication now uses Bearer tokens only',
    ],
  },
  '1.2.0': {
    version: '1.2.0',
    releaseDate: new Date('2026-04-01'),
    status: 'deprecated',
    deprecationDate: new Date('2026-10-01'),
    sunsetDate: new Date('2027-01-01'),
    changelog: [
      'Bug fixes and improvements',
      'Performance optimizations',
    ],
  },
};

// ============================================================================
// REQUEST/RESPONSE VERSIONING
// ============================================================================

export interface VersionedRequest extends Request {
  apiVersion: string;
  versionedParams: Record<string, any>;
}

export interface VersionedResponse {
  version: string;
  timestamp: number;
  data: any;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    errors?: Array<{
      code: string;
      message: string;
      field?: string;
    }>;
  };
}

// ============================================================================
// API VERSION MIDDLEWARE
// ============================================================================

export function apiVersionMiddleware(req: VersionedRequest, res: Response, next: NextFunction) {
  // Extract version from header, URL, or query parameter
  const version =
    req.headers['api-version'] as string ||
    req.query.version as string ||
    extractVersionFromPath(req.path) ||
    '2.0.0'; // Default to latest

  // Validate version
  if (!isValidVersion(version)) {
    return res.status(400).json({
      error: 'Invalid API version',
      supportedVersions: Object.keys(API_VERSIONS),
    });
  }

  // Check if version is sunset
  const versionInfo = API_VERSIONS[version];
  if (versionInfo.status === 'sunset') {
    return res.status(410).json({
      error: 'API version is no longer supported',
      message: `Version ${version} was sunset on ${versionInfo.sunsetDate}`,
      migrateToVersion: '2.0.0',
    });
  }

  // Warn if version is deprecated
  if (versionInfo.status === 'deprecated') {
    res.setHeader('Deprecation', 'true');
    if (versionInfo.sunsetDate) {
      res.setHeader('Sunset', versionInfo.sunsetDate.toISOString());
    }
    res.setHeader('Link', `<https://docs.skycoin4444.com/api/v2>; rel="successor-version"`);
  }

  req.apiVersion = version;
  next();
}

// ============================================================================
// RESPONSE TRANSFORMATION
// ============================================================================

export function transformResponse(data: any, version: string, req: VersionedRequest): VersionedResponse {
  const response: VersionedResponse = {
    version,
    timestamp: Date.now(),
    data: transformDataForVersion(data, version),
  };

  // Add pagination if applicable
  if (Array.isArray(data) && req.query.page) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    response.meta = {
      pagination: {
        page,
        limit,
        total: data.length,
        pages: Math.ceil(data.length / limit),
      },
    };
  }

  return response;
}

export function transformDataForVersion(data: any, version: string): any {
  switch (version) {
    case '1.0.0':
    case '1.1.0':
    case '1.2.0':
      // Old format: return data directly
      return data;

    case '2.0.0':
      // New format: wrap in object with metadata
      if (Array.isArray(data)) {
        return {
          items: data,
          count: data.length,
        };
      }
      return data;

    default:
      return data;
  }
}

// ============================================================================
// REQUEST TRANSFORMATION
// ============================================================================

export function transformRequest(req: VersionedRequest, targetVersion: string): any {
  const sourceVersion = req.apiVersion || '2.0.0';

  if (sourceVersion === targetVersion) {
    return req.body;
  }

  // Transform from old format to new format
  if (sourceVersion === '1.0.0' && targetVersion === '2.0.0') {
    return transformV1ToV2(req.body);
  }

  return req.body;
}

function transformV1ToV2(data: any): any {
  // Example transformation
  if (data.userId) {
    return {
      ...data,
      user_id: data.userId,
    };
  }
  return data;
}

// ============================================================================
// BACKWARD COMPATIBILITY ADAPTERS
// ============================================================================

export interface CompatibilityAdapter {
  fromVersion: string;
  toVersion: string;
  transformRequest: (data: any) => any;
  transformResponse: (data: any) => any;
}

export const COMPATIBILITY_ADAPTERS: CompatibilityAdapter[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '2.0.0',
    transformRequest: (data) => ({
      ...data,
      user_id: data.userId,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    }),
    transformResponse: (data) => ({
      ...data,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }),
  },
  {
    fromVersion: '1.1.0',
    toVersion: '2.0.0',
    transformRequest: (data) => ({
      ...data,
      user_id: data.userId,
    }),
    transformResponse: (data) => ({
      ...data,
      userId: data.user_id,
    }),
  },
];

// ============================================================================
// DEPRECATION WARNINGS
// ============================================================================

export interface DeprecationWarning {
  endpoint: string;
  method: string;
  deprecatedVersion: string;
  sunsetDate: Date;
  replacement?: string;
  migrationGuide?: string;
}

export const DEPRECATION_WARNINGS: DeprecationWarning[] = [
  {
    endpoint: '/mining/status',
    method: 'GET',
    deprecatedVersion: '1.0.0',
    sunsetDate: new Date('2027-01-01'),
    replacement: '/v2/mining/status',
    migrationGuide: 'https://docs.skycoin4444.com/migration/v1-to-v2',
  },
  {
    endpoint: '/trading/orders',
    method: 'GET',
    deprecatedVersion: '1.0.0',
    sunsetDate: new Date('2027-01-01'),
    replacement: '/v2/trading/orders',
    migrationGuide: 'https://docs.skycoin4444.com/migration/v1-to-v2',
  },
];

// ============================================================================
// FEATURE FLAGS FOR GRADUAL ROLLOUT
// ============================================================================

export interface FeatureFlag {
  name: string;
  version: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetRegions?: string[];
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    name: 'new_mining_algorithm',
    version: '2.1.0',
    enabled: true,
    rolloutPercentage: 50,
  },
  {
    name: 'improved_trading_ui',
    version: '2.0.0',
    enabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'ai_recommendations',
    version: '2.2.0',
    enabled: true,
    rolloutPercentage: 25,
    targetUsers: ['premium', 'beta-tester'],
  },
  {
    name: 'multi_region_support',
    version: '2.3.0',
    enabled: false,
    rolloutPercentage: 0,
  },
];

export function isFeatureEnabled(featureName: string, userId?: string, region?: string): boolean {
  const flag = FEATURE_FLAGS.find(f => f.name === featureName);
  if (!flag || !flag.enabled) return false;

  // Check rollout percentage
  if ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100 > flag.rolloutPercentage) return false;

  // Check target users
  if (flag.targetUsers && userId && !flag.targetUsers.includes(userId)) return false;

  // Check target regions
  if (flag.targetRegions && region && !flag.targetRegions.includes(region)) return false;

  return true;
}

// ============================================================================
// VERSION COMPATIBILITY CHECKER
// ============================================================================

export class VersionCompatibilityChecker {
  static isCompatible(clientVersion: string, serverVersion: string): boolean {
    const clientMajor = this.getMajorVersion(clientVersion);
    const serverMajor = this.getMajorVersion(serverVersion);

    // Allow same major version or one version behind
    return serverMajor - clientMajor <= 1;
  }

  static getMajorVersion(version: string): number {
    return parseInt(version.split('.')[0]);
  }

  static getMinorVersion(version: string): number {
    return parseInt(version.split('.')[1]);
  }

  static getPatchVersion(version: string): number {
    return parseInt(version.split('.')[2]);
  }

  static compareVersions(v1: string, v2: string): number {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }

    return 0;
  }
}

// ============================================================================
// API DOCUMENTATION VERSIONING
// ============================================================================

export interface APIEndpointDoc {
  path: string;
  method: string;
  version: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses: Array<{
    status: number;
    description: string;
    schema: any;
  }>;
  examples?: Array<{
    request: any;
    response: any;
  }>;
  deprecated?: boolean;
  replacedBy?: string;
}

export const API_DOCS: APIEndpointDoc[] = [
  {
    path: '/mining/start',
    method: 'POST',
    version: '1.0.0',
    description: 'Start mining operation',
    parameters: [
      {
        name: 'poolId',
        type: 'string',
        required: true,
        description: 'Mining pool ID',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Mining started successfully',
        schema: { miningId: 'string', status: 'string' },
      },
    ],
  },
  {
    path: '/v2/mining/start',
    method: 'POST',
    version: '2.0.0',
    description: 'Start mining operation (v2)',
    parameters: [
      {
        name: 'pool_id',
        type: 'string',
        required: true,
        description: 'Mining pool ID',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Mining started successfully',
        schema: { data: { mining_id: 'string', status: 'string' } },
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isValidVersion(version: string): boolean {
  return version in API_VERSIONS;
}

function extractVersionFromPath(path: string): string | null {
  const match = path.match(/\/v(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

export default {
  API_VERSIONS,
  apiVersionMiddleware,
  transformResponse,
  transformRequest,
  isFeatureEnabled,
  VersionCompatibilityChecker,
};
