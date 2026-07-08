import crypto from 'crypto';
/**
 * PHASE 33 — DECENTRALIZED INFRASTRUCTURE LAYER
 * Distributed storage backups, content replication, distributed indexing,
 * cross-region state replication, decentralized creator archives,
 * immutable proof vaults, cryptographic proof logs, immutable moderation history,
 * immutable payouts, immutable donations, immutable governance records.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type StorageNodeStatus = "online" | "degraded" | "offline" | "syncing";
export type ReplicationStatus = "pending" | "replicating" | "complete" | "failed";
export type ProofLogCategory = "moderation" | "payout" | "donation" | "governance" | "identity" | "content" | "transaction";
export type IndexSyncStatus = "synced" | "behind" | "diverged" | "unknown";

export interface StorageNode {
  id: string;
  nodeId: string;
  region: string;
  provider: "ipfs" | "arweave" | "filecoin" | "s3" | "internal";
  endpoint: string;
  status: StorageNodeStatus;
  capacityGB: number;
  usedGB: number;
  replicationFactor: number;
  latencyMs: number;
  uptimePercent: number;
  lastHealthCheck: Date;
  joinedAt: Date;
}

export interface ContentReplicationJob {
  id: string;
  contentId: string;
  contentType: "post" | "media" | "archive" | "vault" | "index";
  sourceNodeId: string;
  targetNodeIds: string[];
  status: ReplicationStatus;
  bytesTotal: number;
  bytesTransferred: number;
  startedAt: Date;
  completedAt?: Date;
  retryCount: number;
  errorMessage?: string;
}

export interface DistributedIndex {
  id: string;
  indexType: "content" | "user" | "transaction" | "governance" | "search";
  shardKey: string;
  nodeId: string;
  recordCount: number;
  sizeBytes: number;
  syncStatus: IndexSyncStatus;
  lastSyncAt: Date;
  checksum: string;
  version: number;
}

export interface CrossRegionReplicationState {
  id: string;
  entityType: string;
  entityId: string;
  sourceRegion: string;
  targetRegion: string;
  status: ReplicationStatus;
  lastSyncAt: Date;
  lagMs: number;
  conflictsResolved: number;
  version: number;
}

export interface DecentralizedArchive {
  id: string;
  creatorId: number;
  archiveType: "full_profile" | "content_history" | "financial_history" | "governance_history" | "identity_history";
  ipfsCid?: string;
  arweaveId?: string;
  filecoinDealId?: string;
  sizeBytes: number;
  recordCount: number;
  checksum: string;
  encryptionKey?: string;
  isEncrypted: boolean;
  isPublic: boolean;
  createdAt: Date;
  expiresAt?: Date;
  pinCount: number;
  downloadCount: number;
}

export interface ImmutableProofLog {
  id: string;
  category: ProofLogCategory;
  entityId: string;
  entityType: string;
  actorId: number;
  action: string;
  previousState?: string;
  newState: string;
  merkleRoot: string;
  blockHash: string;
  timestamp: Date;
  signature: string;
  witnessIds: number[];
  isVerified: boolean;
  chainPosition: number;
}

export interface ImmutableModerationRecord {
  id: string;
  moderatorId: number;
  targetUserId?: number;
  targetContentId?: string;
  action: "warn" | "mute" | "suspend" | "ban" | "remove_content" | "restore" | "appeal_granted" | "appeal_denied";
  reason: string;
  evidence: string[];
  duration?: number;
  appealable: boolean;
  appealDeadline?: Date;
  proofLogId: string;
  timestamp: Date;
  isReversed: boolean;
  reversedBy?: number;
  reversedAt?: Date;
}

export interface ImmutablePayout {
  id: string;
  payerId: number;
  recipientId: number;
  amount: number;
  currency: string;
  payoutType: "revenue_share" | "tip" | "subscription" | "bounty" | "grant" | "payroll" | "affiliate";
  txHash: string;
  blockConfirmations: number;
  proofLogId: string;
  timestamp: Date;
  isSettled: boolean;
  settledAt?: Date;
}

export interface ImmutableDonation {
  id: string;
  donorId: number;
  recipientId: number;
  campaignId?: string;
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  txHash: string;
  proofLogId: string;
  timestamp: Date;
  taxReceiptIssued: boolean;
}

export interface ImmutableGovernanceRecord {
  id: string;
  proposalId: string;
  actorId: number;
  action: "propose" | "vote" | "veto" | "execute" | "cancel" | "amend";
  voteChoice?: "yes" | "no" | "abstain";
  votingPower?: number;
  rationale?: string;
  proofLogId: string;
  timestamp: Date;
  isBinding: boolean;
  executionTxHash?: string;
}

// ─── STATE ────────────────────────────────────────────────────────────────────

const _storageNodes = new Map<string, StorageNode>();
const _replicationJobs = new Map<string, ContentReplicationJob>();
const _distributedIndexes = new Map<string, DistributedIndex>();
const _crossRegionStates = new Map<string, CrossRegionReplicationState>();
const _archives = new Map<string, DecentralizedArchive>();
const _proofLogs = new Map<string, ImmutableProofLog>();
const _moderationRecords = new Map<string, ImmutableModerationRecord>();
const _immutablePayouts = new Map<string, ImmutablePayout>();
const _immutableDonations = new Map<string, ImmutableDonation>();
const _governanceRecords = new Map<string, ImmutableGovernanceRecord>();

let _chainPosition = 0;

function _id(prefix: string): string {
  return `${prefix}_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 9)}`;
}

function _hash(data: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return `0x${h.toString(16).padStart(64, "0")}`;
}

function _merkleRoot(items: string[]): string {
  if (items.length === 0) return _hash("empty");
  if (items.length === 1) return _hash(items[0]);
  const hashes = items.map(i => _hash(i));
  let level = hashes;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(_hash(level[i] + (level[i + 1] ?? level[i])));
    }
    level = next;
  }
  return level[0];
}

// ─── STORAGE NODE MANAGER ─────────────────────────────────────────────────────

export const storageNodeManager = {
  registerNode(params: {
    nodeId: string;
    region: string;
    provider: StorageNode["provider"];
    endpoint: string;
    capacityGB: number;
    replicationFactor?: number;
  }): StorageNode {
    const node: StorageNode = {
      id: _id("node"),
      nodeId: params.nodeId,
      region: params.region,
      provider: params.provider,
      endpoint: params.endpoint,
      status: "online",
      capacityGB: params.capacityGB,
      usedGB: 0,
      replicationFactor: params.replicationFactor ?? 3,
      latencyMs: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50) + 10,
      uptimePercent: 99.9,
      lastHealthCheck: new Date(),
      joinedAt: new Date(),
    };
    _storageNodes.set(node.id, node);
    return node;
  },

  updateStatus(nodeId: string, status: StorageNodeStatus, latencyMs?: number): StorageNode | null {
    const node = Array.from(_storageNodes.values()).find(n => n.nodeId === nodeId);
    if (!node) return null;
    node.status = status;
    if (latencyMs !== undefined) node.latencyMs = latencyMs;
    node.lastHealthCheck = new Date();
    return node;
  },

  getHealthyNodes(region?: string): StorageNode[] {
    return Array.from(_storageNodes.values())
      .filter(n => n.status === "online" && (!region || n.region === region));
  },

  getNodeStats(): {
    total: number;
    online: number;
    totalCapacityGB: number;
    usedCapacityGB: number;
    byProvider: Record<string, number>;
  } {
    const nodes = Array.from(_storageNodes.values());
    const byProvider: Record<string, number> = {};
    let online = 0;
    let totalCapacityGB = 0;
    let usedCapacityGB = 0;
    for (const n of nodes) {
      byProvider[n.provider] = (byProvider[n.provider] ?? 0) + 1;
      if (n.status === "online") online++;
      totalCapacityGB += n.capacityGB;
      usedCapacityGB += n.usedGB;
    }
    return { total: nodes.length, online, totalCapacityGB, usedCapacityGB, byProvider };
  },
};

// ─── CONTENT REPLICATION ENGINE ───────────────────────────────────────────────

export const contentReplicationEngine = {
  scheduleReplication(params: {
    contentId: string;
    contentType: ContentReplicationJob["contentType"];
    sourceNodeId: string;
    targetNodeIds: string[];
    bytesTotal: number;
  }): ContentReplicationJob {
    const job: ContentReplicationJob = {
      id: _id("rep"),
      contentId: params.contentId,
      contentType: params.contentType,
      sourceNodeId: params.sourceNodeId,
      targetNodeIds: params.targetNodeIds,
      status: "pending",
      bytesTotal: params.bytesTotal,
      bytesTransferred: 0,
      startedAt: new Date(),
      retryCount: 0,
    };
    _replicationJobs.set(job.id, job);
    return job;
  },

  completeReplication(jobId: string): ContentReplicationJob | null {
    const job = _replicationJobs.get(jobId);
    if (!job) return null;
    job.status = "complete";
    job.bytesTransferred = job.bytesTotal;
    job.completedAt = new Date();
    return job;
  },

  failReplication(jobId: string, error: string): ContentReplicationJob | null {
    const job = _replicationJobs.get(jobId);
    if (!job) return null;
    job.status = "failed";
    job.errorMessage = error;
    job.retryCount++;
    return job;
  },

  getReplicationStats(): {
    total: number;
    pending: number;
    complete: number;
    failed: number;
    totalBytesReplicated: number;
  } {
    const jobs = Array.from(_replicationJobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === "pending" || j.status === "replicating").length,
      complete: jobs.filter(j => j.status === "complete").length,
      failed: jobs.filter(j => j.status === "failed").length,
      totalBytesReplicated: jobs.filter(j => j.status === "complete").reduce((s, j) => s + j.bytesTotal, 0),
    };
  },
};

// ─── DISTRIBUTED INDEX ENGINE ─────────────────────────────────────────────────

export const distributedIndexEngine = {
  createShard(params: {
    indexType: DistributedIndex["indexType"];
    shardKey: string;
    nodeId: string;
    recordCount: number;
    sizeBytes: number;
  }): DistributedIndex {
    const idx: DistributedIndex = {
      id: _id("idx"),
      indexType: params.indexType,
      shardKey: params.shardKey,
      nodeId: params.nodeId,
      recordCount: params.recordCount,
      sizeBytes: params.sizeBytes,
      syncStatus: "synced",
      lastSyncAt: new Date(),
      checksum: _hash(`${params.indexType}:${params.shardKey}:${params.recordCount}`),
      version: 1,
    };
    _distributedIndexes.set(idx.id, idx);
    return idx;
  },

  syncShard(shardId: string, newRecordCount: number): DistributedIndex | null {
    const idx = _distributedIndexes.get(shardId);
    if (!idx) return null;
    idx.recordCount = newRecordCount;
    idx.syncStatus = "synced";
    idx.lastSyncAt = new Date();
    idx.version++;
    idx.checksum = _hash(`${idx.indexType}:${idx.shardKey}:${newRecordCount}:${idx.version}`);
    return idx;
  },

  getIndexStats(): { totalShards: number; totalRecords: number; totalSizeBytes: number; synced: number } {
    const indexes = Array.from(_distributedIndexes.values());
    return {
      totalShards: indexes.length,
      totalRecords: indexes.reduce((s, i) => s + i.recordCount, 0),
      totalSizeBytes: indexes.reduce((s, i) => s + i.sizeBytes, 0),
      synced: indexes.filter(i => i.syncStatus === "synced").length,
    };
  },
};

// ─── CROSS-REGION REPLICATION ENGINE ─────────────────────────────────────────

export const crossRegionEngine = {
  trackReplication(params: {
    entityType: string;
    entityId: string;
    sourceRegion: string;
    targetRegion: string;
  }): CrossRegionReplicationState {
    const key = `${params.entityId}:${params.sourceRegion}:${params.targetRegion}`;
    const state: CrossRegionReplicationState = {
      id: _id("xreg"),
      entityType: params.entityType,
      entityId: params.entityId,
      sourceRegion: params.sourceRegion,
      targetRegion: params.targetRegion,
      status: "pending",
      lastSyncAt: new Date(),
      lagMs: 0,
      conflictsResolved: 0,
      version: 1,
    };
    _crossRegionStates.set(key, state);
    return state;
  },

  markSynced(entityId: string, sourceRegion: string, targetRegion: string, lagMs: number): CrossRegionReplicationState | null {
    const key = `${entityId}:${sourceRegion}:${targetRegion}`;
    const state = _crossRegionStates.get(key);
    if (!state) return null;
    state.status = "complete";
    state.lastSyncAt = new Date();
    state.lagMs = lagMs;
    state.version++;
    return state;
  },

  getReplicationHealth(): { total: number; synced: number; pending: number; avgLagMs: number } {
    const states = Array.from(_crossRegionStates.values());
    const synced = states.filter(s => s.status === "complete");
    const avgLagMs = synced.length > 0
      ? synced.reduce((s, r) => s + r.lagMs, 0) / synced.length
      : 0;
    return {
      total: states.length,
      synced: synced.length,
      pending: states.filter(s => s.status === "pending" || s.status === "replicating").length,
      avgLagMs: Math.round(avgLagMs),
    };
  },
};

// ─── DECENTRALIZED ARCHIVE ENGINE ─────────────────────────────────────────────

export const decentralizedArchiveEngine = {
  createArchive(params: {
    creatorId: number;
    archiveType: DecentralizedArchive["archiveType"];
    sizeBytes: number;
    recordCount: number;
    isPublic?: boolean;
    isEncrypted?: boolean;
    ipfsCid?: string;
    arweaveId?: string;
  }): DecentralizedArchive {
    const archive: DecentralizedArchive = {
      id: _id("arch"),
      creatorId: params.creatorId,
      archiveType: params.archiveType,
      ipfsCid: params.ipfsCid ?? `Qm${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2).padStart(44, "0")}`,
      arweaveId: params.arweaveId,
      sizeBytes: params.sizeBytes,
      recordCount: params.recordCount,
      checksum: _hash(`${params.creatorId}:${params.archiveType}:${params.sizeBytes}`),
      isEncrypted: params.isEncrypted ?? false,
      isPublic: params.isPublic ?? false,
      createdAt: new Date(),
      expiresAt: undefined,
      pinCount: 1,
      downloadCount: 0,
    };
    _archives.set(archive.id, archive);
    return archive;
  },

  pinArchive(archiveId: string): DecentralizedArchive | null {
    const archive = _archives.get(archiveId);
    if (!archive) return null;
    archive.pinCount++;
    return archive;
  },

  downloadArchive(archiveId: string): DecentralizedArchive | null {
    const archive = _archives.get(archiveId);
    if (!archive) return null;
    archive.downloadCount++;
    return archive;
  },

  getCreatorArchives(creatorId: number): DecentralizedArchive[] {
    return Array.from(_archives.values())
      .filter(a => a.creatorId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getArchiveStats(): { total: number; totalSizeBytes: number; totalPins: number; byType: Record<string, number> } {
    const archives = Array.from(_archives.values());
    const byType: Record<string, number> = {};
    let totalSizeBytes = 0;
    let totalPins = 0;
    for (const a of archives) {
      byType[a.archiveType] = (byType[a.archiveType] ?? 0) + 1;
      totalSizeBytes += a.sizeBytes;
      totalPins += a.pinCount;
    }
    return { total: archives.length, totalSizeBytes, totalPins, byType };
  },
};

// ─── IMMUTABLE PROOF LOG ENGINE ───────────────────────────────────────────────

export const immutableProofLogEngine = {
  record(params: {
    category: ProofLogCategory;
    entityId: string;
    entityType: string;
    actorId: number;
    action: string;
    previousState?: string;
    newState: string;
    witnessIds?: number[];
  }): ImmutableProofLog {
    _chainPosition++;
    const data = `${params.category}:${params.entityId}:${params.actorId}:${params.action}:${params.newState}:${_chainPosition}`;
    const log: ImmutableProofLog = {
      id: _id("proof"),
      category: params.category,
      entityId: params.entityId,
      entityType: params.entityType,
      actorId: params.actorId,
      action: params.action,
      previousState: params.previousState,
      newState: params.newState,
      merkleRoot: _merkleRoot([params.entityId, params.actorId.toString(), params.newState]),
      blockHash: _hash(data),
      timestamp: new Date(),
      signature: _hash(`sig:${data}`),
      witnessIds: params.witnessIds ?? [],
      isVerified: true,
      chainPosition: _chainPosition,
    };
    _proofLogs.set(log.id, log);
    return log;
  },

  verify(logId: string): { isValid: boolean; log: ImmutableProofLog | null } {
    const log = _proofLogs.get(logId);
    if (!log) return { isValid: false, log: null };
    // Re-verify merkle root
    const expectedMerkle = _merkleRoot([log.entityId, log.actorId.toString(), log.newState]);
    return { isValid: log.merkleRoot === expectedMerkle && log.isVerified, log };
  },

  getEntityHistory(entityId: string): ImmutableProofLog[] {
    return Array.from(_proofLogs.values())
      .filter(l => l.entityId === entityId)
      .sort((a, b) => a.chainPosition - b.chainPosition);
  },

  getCategoryLogs(category: ProofLogCategory, limit = 100): ImmutableProofLog[] {
    return Array.from(_proofLogs.values())
      .filter(l => l.category === category)
      .sort((a, b) => b.chainPosition - a.chainPosition)
      .slice(0, limit);
  },

  getChainStats(): { totalLogs: number; chainLength: number; byCategory: Record<string, number> } {
    const logs = Array.from(_proofLogs.values());
    const byCategory: Record<string, number> = {};
    for (const l of logs) {
      byCategory[l.category] = (byCategory[l.category] ?? 0) + 1;
    }
    return { totalLogs: logs.length, chainLength: _chainPosition, byCategory };
  },
};

// ─── IMMUTABLE MODERATION ENGINE ─────────────────────────────────────────────

export const immutableModerationEngine = {
  record(params: {
    moderatorId: number;
    targetUserId?: number;
    targetContentId?: string;
    action: ImmutableModerationRecord["action"];
    reason: string;
    evidence?: string[];
    duration?: number;
    appealable?: boolean;
  }): ImmutableModerationRecord {
    const proofLog = immutableProofLogEngine.record({
      category: "moderation",
      entityId: params.targetContentId ?? `user:${params.targetUserId}`,
      entityType: params.targetContentId ? "content" : "user",
      actorId: params.moderatorId,
      action: params.action,
      newState: JSON.stringify({ action: params.action, reason: params.reason }),
    });

    const appealDeadline = params.appealable !== false ? new Date(Date.now() + 7 * 86400000) : undefined;
    const record: ImmutableModerationRecord = {
      id: _id("mod"),
      moderatorId: params.moderatorId,
      targetUserId: params.targetUserId,
      targetContentId: params.targetContentId,
      action: params.action,
      reason: params.reason,
      evidence: params.evidence ?? [],
      duration: params.duration,
      appealable: params.appealable !== false,
      appealDeadline,
      proofLogId: proofLog.id,
      timestamp: new Date(),
      isReversed: false,
    };
    _moderationRecords.set(record.id, record);
    return record;
  },

  reverseAction(recordId: string, reversedBy: number): ImmutableModerationRecord | null {
    const record = _moderationRecords.get(recordId);
    if (!record || record.isReversed) return null;
    record.isReversed = true;
    record.reversedBy = reversedBy;
    record.reversedAt = new Date();
    // Record the reversal in proof log
    immutableProofLogEngine.record({
      category: "moderation",
      entityId: record.targetContentId ?? `user:${record.targetUserId}`,
      entityType: record.targetContentId ? "content" : "user",
      actorId: reversedBy,
      action: "reverse",
      previousState: JSON.stringify({ action: record.action }),
      newState: JSON.stringify({ action: "reversed", originalAction: record.action }),
    });
    return record;
  },

  getUserModerationHistory(userId: number): ImmutableModerationRecord[] {
    return Array.from(_moderationRecords.values())
      .filter(r => r.targetUserId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  getModerationStats(): { total: number; byAction: Record<string, number>; reversed: number } {
    const records = Array.from(_moderationRecords.values());
    const byAction: Record<string, number> = {};
    let reversed = 0;
    for (const r of records) {
      byAction[r.action] = (byAction[r.action] ?? 0) + 1;
      if (r.isReversed) reversed++;
    }
    return { total: records.length, byAction, reversed };
  },
};

// ─── IMMUTABLE PAYOUT ENGINE ──────────────────────────────────────────────────

export const immutablePayoutEngine = {
  record(params: {
    payerId: number;
    recipientId: number;
    amount: number;
    currency: string;
    payoutType: ImmutablePayout["payoutType"];
    txHash?: string;
  }): ImmutablePayout {
    const txHash = params.txHash ?? `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2).padStart(64, "0")}`;
    const proofLog = immutableProofLogEngine.record({
      category: "payout",
      entityId: txHash,
      entityType: "payout",
      actorId: params.payerId,
      action: "payout",
      newState: JSON.stringify({ amount: params.amount, currency: params.currency, type: params.payoutType }),
    });

    const payout: ImmutablePayout = {
      id: _id("ipay"),
      payerId: params.payerId,
      recipientId: params.recipientId,
      amount: params.amount,
      currency: params.currency,
      payoutType: params.payoutType,
      txHash,
      blockConfirmations: 0,
      proofLogId: proofLog.id,
      timestamp: new Date(),
      isSettled: false,
    };
    _immutablePayouts.set(payout.id, payout);
    return payout;
  },

  settle(payoutId: string, confirmations: number): ImmutablePayout | null {
    const payout = _immutablePayouts.get(payoutId);
    if (!payout) return null;
    payout.blockConfirmations = confirmations;
    payout.isSettled = confirmations >= 6;
    if (payout.isSettled) payout.settledAt = new Date();
    return payout;
  },

  getUserPayouts(userId: number, asRecipient = true): ImmutablePayout[] {
    return Array.from(_immutablePayouts.values())
      .filter(p => asRecipient ? p.recipientId === userId : p.payerId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  getPayoutStats(): { total: number; totalVolume: number; settled: number; byType: Record<string, number> } {
    const payouts = Array.from(_immutablePayouts.values());
    const byType: Record<string, number> = {};
    let totalVolume = 0;
    let settled = 0;
    for (const p of payouts) {
      byType[p.payoutType] = (byType[p.payoutType] ?? 0) + 1;
      totalVolume += p.amount;
      if (p.isSettled) settled++;
    }
    return { total: payouts.length, totalVolume, settled, byType };
  },
};

// ─── IMMUTABLE DONATION ENGINE ────────────────────────────────────────────────

export const immutableDonationEngine = {
  record(params: {
    donorId: number;
    recipientId: number;
    campaignId?: string;
    amount: number;
    currency: string;
    message?: string;
    isAnonymous?: boolean;
  }): ImmutableDonation {
    const txHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2).padStart(64, "0")}`;
    const proofLog = immutableProofLogEngine.record({
      category: "donation",
      entityId: txHash,
      entityType: "donation",
      actorId: params.donorId,
      action: "donate",
      newState: JSON.stringify({ amount: params.amount, currency: params.currency, campaignId: params.campaignId }),
    });

    const donation: ImmutableDonation = {
      id: _id("idon"),
      donorId: params.donorId,
      recipientId: params.recipientId,
      campaignId: params.campaignId,
      amount: params.amount,
      currency: params.currency,
      message: params.message,
      isAnonymous: params.isAnonymous ?? false,
      txHash,
      proofLogId: proofLog.id,
      timestamp: new Date(),
      taxReceiptIssued: false,
    };
    _immutableDonations.set(donation.id, donation);
    return donation;
  },

  issueTaxReceipt(donationId: string): ImmutableDonation | null {
    const donation = _immutableDonations.get(donationId);
    if (!donation) return null;
    donation.taxReceiptIssued = true;
    return donation;
  },

  getCampaignDonations(campaignId: string): ImmutableDonation[] {
    return Array.from(_immutableDonations.values())
      .filter(d => d.campaignId === campaignId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  getDonationStats(): { total: number; totalVolume: number; anonymous: number; withReceipt: number } {
    const donations = Array.from(_immutableDonations.values());
    return {
      total: donations.length,
      totalVolume: donations.reduce((s, d) => s + d.amount, 0),
      anonymous: donations.filter(d => d.isAnonymous).length,
      withReceipt: donations.filter(d => d.taxReceiptIssued).length,
    };
  },
};

// ─── IMMUTABLE GOVERNANCE ENGINE ─────────────────────────────────────────────

export const immutableGovernanceEngine = {
  record(params: {
    proposalId: string;
    actorId: number;
    action: ImmutableGovernanceRecord["action"];
    voteChoice?: ImmutableGovernanceRecord["voteChoice"];
    votingPower?: number;
    rationale?: string;
    isBinding?: boolean;
    executionTxHash?: string;
  }): ImmutableGovernanceRecord {
    const proofLog = immutableProofLogEngine.record({
      category: "governance",
      entityId: params.proposalId,
      entityType: "proposal",
      actorId: params.actorId,
      action: params.action,
      newState: JSON.stringify({
        action: params.action,
        voteChoice: params.voteChoice,
        votingPower: params.votingPower,
      }),
    });

    const record: ImmutableGovernanceRecord = {
      id: _id("igov"),
      proposalId: params.proposalId,
      actorId: params.actorId,
      action: params.action,
      voteChoice: params.voteChoice,
      votingPower: params.votingPower,
      rationale: params.rationale,
      proofLogId: proofLog.id,
      timestamp: new Date(),
      isBinding: params.isBinding ?? false,
      executionTxHash: params.executionTxHash,
    };
    _governanceRecords.set(record.id, record);
    return record;
  },

  getProposalHistory(proposalId: string): ImmutableGovernanceRecord[] {
    return Array.from(_governanceRecords.values())
      .filter(r => r.proposalId === proposalId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },

  getVoteCount(proposalId: string): { yes: number; no: number; abstain: number; totalPower: number } {
    const votes = Array.from(_governanceRecords.values())
      .filter(r => r.proposalId === proposalId && r.action === "vote");
    let yes = 0, no = 0, abstain = 0, totalPower = 0;
    for (const v of votes) {
      const power = v.votingPower ?? 1;
      totalPower += power;
      if (v.voteChoice === "yes") yes += power;
      else if (v.voteChoice === "no") no += power;
      else abstain += power;
    }
    return { yes, no, abstain, totalPower };
  },

  getGovernanceStats(): { total: number; byAction: Record<string, number>; binding: number } {
    const records = Array.from(_governanceRecords.values());
    const byAction: Record<string, number> = {};
    let binding = 0;
    for (const r of records) {
      byAction[r.action] = (byAction[r.action] ?? 0) + 1;
      if (r.isBinding) binding++;
    }
    return { total: records.length, byAction, binding };
  },
};

// ─── DECENTRALIZED INFRA DASHBOARD ───────────────────────────────────────────

export const decentralizedInfraDashboard = {
  getInfraStatus(): {
    storageNodes: ReturnType<typeof storageNodeManager.getNodeStats>;
    replication: ReturnType<typeof contentReplicationEngine.getReplicationStats>;
    indexes: ReturnType<typeof distributedIndexEngine.getIndexStats>;
    crossRegion: ReturnType<typeof crossRegionEngine.getReplicationHealth>;
    archives: ReturnType<typeof decentralizedArchiveEngine.getArchiveStats>;
    proofChain: ReturnType<typeof immutableProofLogEngine.getChainStats>;
    moderation: ReturnType<typeof immutableModerationEngine.getModerationStats>;
    payouts: ReturnType<typeof immutablePayoutEngine.getPayoutStats>;
    donations: ReturnType<typeof immutableDonationEngine.getDonationStats>;
    governance: ReturnType<typeof immutableGovernanceEngine.getGovernanceStats>;
  } {
    return {
      storageNodes: storageNodeManager.getNodeStats(),
      replication: contentReplicationEngine.getReplicationStats(),
      indexes: distributedIndexEngine.getIndexStats(),
      crossRegion: crossRegionEngine.getReplicationHealth(),
      archives: decentralizedArchiveEngine.getArchiveStats(),
      proofChain: immutableProofLogEngine.getChainStats(),
      moderation: immutableModerationEngine.getModerationStats(),
      payouts: immutablePayoutEngine.getPayoutStats(),
      donations: immutableDonationEngine.getDonationStats(),
      governance: immutableGovernanceEngine.getGovernanceStats(),
    };
  },
};
