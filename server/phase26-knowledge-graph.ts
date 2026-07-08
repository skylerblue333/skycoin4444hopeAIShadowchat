import crypto from 'crypto';
/**
 * PHASE 26 — KNOWLEDGE GRAPH ENGINE
 * Trust Graph, Influence Graph, Transaction Graph, Content Graph, Virality Graph
 * Goal: Everything connected.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type NodeType =
  | "user" | "creator" | "community" | "wallet" | "post" | "nft"
  | "product" | "donation" | "referral" | "stream" | "event" | "campaign";

export type EdgeType =
  | "follows" | "subscribes" | "tips" | "purchases" | "owns_nft" | "donated_to"
  | "referred" | "collab" | "co_community" | "transacted_with" | "created"
  | "commented_on" | "liked" | "shared" | "watched" | "mentioned" | "endorsed";

export interface GraphNode {
  id: string;
  nodeType: NodeType;
  entityId: string | number;
  label: string;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  // Computed scores
  pageRankScore: number;
  influenceScore: number;
  trustScore: number;
  viralityScore: number;
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: EdgeType;
  weight: number;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustPath {
  fromNodeId: string;
  toNodeId: string;
  path: string[];
  hops: number;
  trustScore: number;
  computedAt: Date;
}

export interface InfluenceCluster {
  id: string;
  centerId: string;
  memberIds: string[];
  clusterType: "creator_network" | "community_hub" | "whale_network" | "viral_chain";
  totalInfluence: number;
  avgTrustScore: number;
  createdAt: Date;
}

export interface TransactionFlow {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  transactionType: "tip" | "purchase" | "stake" | "nft_sale" | "donation" | "payout" | "referral_bonus";
  timestamp: Date;
  blockHash?: string;
  isVerified: boolean;
}

export interface ContentLineage {
  id: string;
  originalPostId: string;
  derivedPostId: string;
  lineageType: "remix" | "quote" | "reply" | "clip" | "translation" | "reaction";
  creatorId: number;
  createdAt: Date;
}

export interface ViralChain {
  id: string;
  originPostId: string;
  chainLinks: Array<{
    postId: string;
    creatorId: number;
    shareType: "repost" | "quote" | "clip" | "external";
    timestamp: Date;
    reachAtShare: number;
  }>;
  totalReach: number;
  peakVelocity: number;
  duration: number; // hours
  isActive: boolean;
  startedAt: Date;
}

export interface GraphQuery {
  startNodeId: string;
  edgeTypes?: EdgeType[];
  maxDepth?: number;
  minWeight?: number;
  limit?: number;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  depth: number;
  executionTimeMs: number;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _nodes = new Map<string, GraphNode>();
const _edges = new Map<string, GraphEdge>();
const _edgesByFrom = new Map<string, Set<string>>();
const _edgesByTo = new Map<string, Set<string>>();
const _trustPaths = new Map<string, TrustPath>();
const _influenceClusters = new Map<string, InfluenceCluster>();
const _transactionFlows = new Map<string, TransactionFlow>();
const _contentLineage = new Map<string, ContentLineage>();
const _viralChains = new Map<string, ViralChain>();

// ─── GRAPH CORE ENGINE ────────────────────────────────────────────────────────

export const graphCoreEngine = {
  addNode(params: Omit<GraphNode, "createdAt" | "updatedAt" | "pageRankScore" | "influenceScore" | "trustScore" | "viralityScore">): GraphNode {
    const node: GraphNode = {
      ...params,
      pageRankScore: 0.15,
      influenceScore: 0,
      trustScore: 0.5,
      viralityScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _nodes.set(node.id, node);
    return node;
  },

  getNode(id: string): GraphNode | null {
    return _nodes.get(id) ?? null;
  },

  updateNode(id: string, updates: Partial<GraphNode>): GraphNode | null {
    const node = _nodes.get(id);
    if (!node) return null;
    Object.assign(node, updates, { updatedAt: new Date() });
    return node;
  },

  addEdge(params: Omit<GraphEdge, "id" | "createdAt" | "updatedAt">): GraphEdge {
    const id = `edge_${params.fromNodeId}_${params.edgeType}_${params.toNodeId}_${Date.now()}`;
    const edge: GraphEdge = { ...params, id, createdAt: new Date(), updatedAt: new Date() };
    _edges.set(id, edge);
    if (!_edgesByFrom.has(params.fromNodeId)) _edgesByFrom.set(params.fromNodeId, new Set());
    _edgesByFrom.get(params.fromNodeId)!.add(id);
    if (!_edgesByTo.has(params.toNodeId)) _edgesByTo.set(params.toNodeId, new Set());
    _edgesByTo.get(params.toNodeId)!.add(id);
    // Update node scores
    this._updateNodeScores(params.toNodeId, params.edgeType, params.weight);
    return edge;
  },

  _updateNodeScores(nodeId: string, edgeType: EdgeType, weight: number): void {
    const node = _nodes.get(nodeId);
    if (!node) return;
    const influenceWeights: Record<string, number> = {
      follows: 0.1, subscribes: 0.3, tips: 0.5, purchases: 0.4, endorsed: 0.6,
      donated_to: 0.3, collab: 0.4, mentioned: 0.2, shared: 0.2, liked: 0.05,
    };
    const trustWeights: Record<string, number> = {
      transacted_with: 0.2, donated_to: 0.3, endorsed: 0.4, collab: 0.3,
    };
    node.influenceScore += (influenceWeights[edgeType] ?? 0.1) * weight;
    node.trustScore = Math.min(1, node.trustScore + (trustWeights[edgeType] ?? 0) * weight * 0.1);
    node.updatedAt = new Date();
  },

  getNeighbors(nodeId: string, direction: "out" | "in" | "both" = "both", edgeTypes?: EdgeType[]): { node: GraphNode; edge: GraphEdge }[] {
    const results: { node: GraphNode; edge: GraphEdge }[] = [];
    const edgeIds = new Set<string>();
    if (direction === "out" || direction === "both") {
      for (const id of _edgesByFrom.get(nodeId) ?? []) edgeIds.add(id);
    }
    if (direction === "in" || direction === "both") {
      for (const id of _edgesByTo.get(nodeId) ?? []) edgeIds.add(id);
    }
    for (const edgeId of edgeIds) {
      const edge = _edges.get(edgeId);
      if (!edge) continue;
      if (edgeTypes && !edgeTypes.includes(edge.edgeType)) continue;
      const neighborId = edge.fromNodeId === nodeId ? edge.toNodeId : edge.fromNodeId;
      const neighbor = _nodes.get(neighborId);
      if (neighbor) results.push({ node: neighbor, edge });
    }
    return results;
  },

  traverseBFS(query: GraphQuery): GraphQueryResult {
    const start = Date.now();
    const { startNodeId, edgeTypes, maxDepth = 3, minWeight = 0, limit = 100 } = query;
    const visited = new Set<string>([startNodeId]);
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];
    const resultNodes: GraphNode[] = [];
    const resultEdges: GraphEdge[] = [];
    let maxDepthReached = 0;

    const startNode = _nodes.get(startNodeId);
    if (startNode) resultNodes.push(startNode);

    while (queue.length > 0 && resultNodes.length < limit) {
      const { nodeId, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;
      maxDepthReached = Math.max(maxDepthReached, depth);

      const neighbors = this.getNeighbors(nodeId, "out", edgeTypes);
      for (const { node, edge } of neighbors) {
        if (edge.weight < minWeight) continue;
        if (!visited.has(node.id)) {
          visited.add(node.id);
          resultNodes.push(node);
          queue.push({ nodeId: node.id, depth: depth + 1 });
        }
        resultEdges.push(edge);
        if (resultNodes.length >= limit) break;
      }
    }

    return {
      nodes: resultNodes,
      edges: resultEdges,
      depth: maxDepthReached,
      executionTimeMs: Date.now() - start,
    };
  },

  getGraphStats(): { nodeCount: number; edgeCount: number; byNodeType: Record<string, number>; byEdgeType: Record<string, number> } {
    const byNodeType: Record<string, number> = {};
    const byEdgeType: Record<string, number> = {};
    for (const n of _nodes.values()) byNodeType[n.nodeType] = (byNodeType[n.nodeType] ?? 0) + 1;
    for (const e of _edges.values()) byEdgeType[e.edgeType] = (byEdgeType[e.edgeType] ?? 0) + 1;
    return { nodeCount: _nodes.size, edgeCount: _edges.size, byNodeType, byEdgeType };
  },
};

// ─── TRUST GRAPH ENGINE ───────────────────────────────────────────────────────

export const trustGraphEngine = {
  computeTrustPath(fromNodeId: string, toNodeId: string): TrustPath {
    const key = `${fromNodeId}_${toNodeId}`;
    // BFS to find shortest trust path
    const visited = new Set<string>([fromNodeId]);
    const queue: Array<{ nodeId: string; path: string[]; score: number }> = [
      { nodeId: fromNodeId, path: [fromNodeId], score: 1.0 }
    ];
    let bestPath: string[] = [];
    let bestScore = 0;
    let hops = 0;

    while (queue.length > 0) {
      const { nodeId, path, score } = queue.shift()!;
      if (nodeId === toNodeId) {
        bestPath = path;
        bestScore = score;
        hops = path.length - 1;
        break;
      }
      if (path.length > 5) continue; // max 4 hops
      const neighbors = graphCoreEngine.getNeighbors(nodeId, "out");
      for (const { node, edge } of neighbors) {
        if (!visited.has(node.id)) {
          visited.add(node.id);
          const newScore = score * edge.weight * node.trustScore;
          queue.push({ nodeId: node.id, path: [...path, node.id], score: newScore });
        }
      }
    }

    const trustPath: TrustPath = {
      fromNodeId,
      toNodeId,
      path: bestPath,
      hops,
      trustScore: bestScore,
      computedAt: new Date(),
    };
    _trustPaths.set(key, trustPath);
    return trustPath;
  },

  getTrustScore(fromNodeId: string, toNodeId: string): number {
    const key = `${fromNodeId}_${toNodeId}`;
    const existing = _trustPaths.get(key);
    if (existing && Date.now() - existing.computedAt.getTime() < 3600000) {
      return existing.trustScore;
    }
    return this.computeTrustPath(fromNodeId, toNodeId).trustScore;
  },

  getTopTrustedNodes(nodeId: string, limit = 10): Array<{ node: GraphNode; trustScore: number }> {
    const neighbors = graphCoreEngine.getNeighbors(nodeId, "out");
    return neighbors
      .map(({ node, edge }) => ({ node, trustScore: edge.weight * node.trustScore }))
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, limit);
  },

  getMutualTrust(nodeIdA: string, nodeIdB: string): { aToB: number; bToA: number; mutual: number } {
    const aToB = this.getTrustScore(nodeIdA, nodeIdB);
    const bToA = this.getTrustScore(nodeIdB, nodeIdA);
    return { aToB, bToA, mutual: (aToB + bToA) / 2 };
  },
};

// ─── INFLUENCE GRAPH ENGINE ───────────────────────────────────────────────────

export const influenceGraphEngine = {
  runPageRank(iterations = 20, dampingFactor = 0.85): void {
    const nodeIds = Array.from(_nodes.keys());
    const n = nodeIds.length;
    if (n === 0) return;

    // Initialize
    for (const node of _nodes.values()) node.pageRankScore = 1 / n;

    for (let iter = 0; iter < iterations; iter++) {
      const newScores = new Map<string, number>();
      for (const nodeId of nodeIds) {
        const inNeighbors = graphCoreEngine.getNeighbors(nodeId, "in");
        let sum = 0;
        for (const { node: neighbor, edge } of inNeighbors) {
          const outCount = (_edgesByFrom.get(neighbor.id)?.size ?? 1);
          sum += (neighbor.pageRankScore * edge.weight) / outCount;
        }
        newScores.set(nodeId, (1 - dampingFactor) / n + dampingFactor * sum);
      }
      for (const [id, score] of newScores) {
        const node = _nodes.get(id);
        if (node) node.pageRankScore = score;
      }
    }
  },

  getTopInfluencers(nodeType?: NodeType, limit = 20): GraphNode[] {
    return Array.from(_nodes.values())
      .filter(n => !nodeType || n.nodeType === nodeType)
      .sort((a, b) => b.influenceScore - a.influenceScore)
      .slice(0, limit);
  },

  detectInfluenceClusters(): InfluenceCluster[] {
    // Simple community detection: find nodes with mutual high-weight edges
    const processed = new Set<string>();
    const clusters: InfluenceCluster[] = [];

    for (const node of _nodes.values()) {
      if (processed.has(node.id) || node.nodeType !== "creator") continue;
      const neighbors = graphCoreEngine.getNeighbors(node.id, "both", ["follows", "collab", "subscribes"]);
      if (neighbors.length < 2) continue;

      const memberIds = [node.id, ...neighbors.slice(0, 9).map(n => n.node.id)];
      for (const id of memberIds) processed.add(id);

      const cluster: InfluenceCluster = {
        id: `cluster_${node.id}_${Date.now()}`,
        centerId: node.id,
        memberIds,
        clusterType: "creator_network",
        totalInfluence: memberIds.reduce((s, id) => s + (_nodes.get(id)?.influenceScore ?? 0), 0),
        avgTrustScore: memberIds.reduce((s, id) => s + (_nodes.get(id)?.trustScore ?? 0), 0) / memberIds.length,
        createdAt: new Date(),
      };
      _influenceClusters.set(cluster.id, cluster);
      clusters.push(cluster);
    }
    return clusters;
  },

  getInfluenceClusters(): InfluenceCluster[] {
    return Array.from(_influenceClusters.values()).sort((a, b) => b.totalInfluence - a.totalInfluence);
  },

  getInfluenceScore(nodeId: string): number {
    return _nodes.get(nodeId)?.influenceScore ?? 0;
  },
};

// ─── TRANSACTION GRAPH ENGINE ─────────────────────────────────────────────────

export const transactionGraphEngine = {
  recordFlow(params: Omit<TransactionFlow, "id">): TransactionFlow {
    const id = `txflow_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const flow: TransactionFlow = { ...params, id };
    _transactionFlows.set(id, flow);

    // Add edge to graph
    const fromNodeId = `wallet_${params.fromWalletId}`;
    const toNodeId = `wallet_${params.toWalletId}`;
    if (!_nodes.has(fromNodeId)) {
      graphCoreEngine.addNode({ id: fromNodeId, nodeType: "wallet", entityId: params.fromWalletId, label: params.fromWalletId, properties: {} });
    }
    if (!_nodes.has(toNodeId)) {
      graphCoreEngine.addNode({ id: toNodeId, nodeType: "wallet", entityId: params.toWalletId, label: params.toWalletId, properties: {} });
    }
    graphCoreEngine.addEdge({
      fromNodeId,
      toNodeId,
      edgeType: "transacted_with",
      weight: Math.min(1, params.amount / 1000),
      properties: { amount: params.amount, currency: params.currency, type: params.transactionType },
    });

    return flow;
  },

  getWalletFlows(walletId: string, direction: "in" | "out" | "both" = "both"): TransactionFlow[] {
    return Array.from(_transactionFlows.values()).filter(f =>
      (direction === "both" || direction === "out") && f.fromWalletId === walletId ||
      (direction === "both" || direction === "in") && f.toWalletId === walletId
    );
  },

  getTopWallets(limit = 20): Array<{ walletId: string; totalVolume: number; txCount: number }> {
    const walletStats: Record<string, { totalVolume: number; txCount: number }> = {};
    for (const flow of _transactionFlows.values()) {
      for (const wId of [flow.fromWalletId, flow.toWalletId]) {
        if (!walletStats[wId]) walletStats[wId] = { totalVolume: 0, txCount: 0 };
        walletStats[wId].totalVolume += flow.amount;
        walletStats[wId].txCount++;
      }
    }
    return Object.entries(walletStats)
      .map(([walletId, stats]) => ({ walletId, ...stats }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, limit);
  },

  detectSuspiciousPatterns(): Array<{ walletId: string; reason: string; riskScore: number }> {
    const suspicious: Array<{ walletId: string; reason: string; riskScore: number }> = [];
    const walletFlows: Record<string, TransactionFlow[]> = {};
    for (const flow of _transactionFlows.values()) {
      if (!walletFlows[flow.fromWalletId]) walletFlows[flow.fromWalletId] = [];
      walletFlows[flow.fromWalletId].push(flow);
    }
    for (const [walletId, flows] of Object.entries(walletFlows)) {
      // High velocity: many transactions in short time
      const recentFlows = flows.filter(f => Date.now() - f.timestamp.getTime() < 3600000);
      if (recentFlows.length > 50) {
        suspicious.push({ walletId, reason: "high_velocity", riskScore: Math.min(1, recentFlows.length / 100) });
      }
      // Circular flow detection
      const toWallets = new Set(flows.map(f => f.toWalletId));
      const fromFlows = Array.from(_transactionFlows.values()).filter(f => toWallets.has(f.fromWalletId) && f.toWalletId === walletId);
      if (fromFlows.length > 0) {
        suspicious.push({ walletId, reason: "circular_flow", riskScore: 0.7 });
      }
    }
    return suspicious;
  },

  getTransactionVolume(currency?: string): { total: number; byType: Record<string, number> } {
    const flows = Array.from(_transactionFlows.values()).filter(f => !currency || f.currency === currency);
    const byType: Record<string, number> = {};
    let total = 0;
    for (const f of flows) {
      total += f.amount;
      byType[f.transactionType] = (byType[f.transactionType] ?? 0) + f.amount;
    }
    return { total, byType };
  },
};

// ─── CONTENT GRAPH ENGINE ────────────────────────────────────────────────────

export const contentGraphEngine = {
  recordLineage(params: Omit<ContentLineage, "id">): ContentLineage {
    const id = `lineage_${params.originalPostId}_${params.derivedPostId}`;
    const lineage: ContentLineage = { ...params, id };
    _contentLineage.set(id, lineage);

    // Add edge in graph
    graphCoreEngine.addEdge({
      fromNodeId: `post_${params.derivedPostId}`,
      toNodeId: `post_${params.originalPostId}`,
      edgeType: "created",
      weight: 0.8,
      properties: { lineageType: params.lineageType },
    });

    return lineage;
  },

  getContentTree(postId: string): { original: ContentLineage[]; derived: ContentLineage[] } {
    const all = Array.from(_contentLineage.values());
    return {
      original: all.filter(l => l.derivedPostId === postId),
      derived: all.filter(l => l.originalPostId === postId),
    };
  },

  getTopRemixedContent(limit = 10): Array<{ postId: string; remixCount: number }> {
    const counts: Record<string, number> = {};
    for (const l of _contentLineage.values()) {
      counts[l.originalPostId] = (counts[l.originalPostId] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([postId, remixCount]) => ({ postId, remixCount }));
  },

  getCreatorContentGraph(creatorId: number): { posts: string[]; remixes: ContentLineage[]; derivatives: ContentLineage[] } {
    const all = Array.from(_contentLineage.values());
    const creatorLineage = all.filter(l => l.creatorId === creatorId);
    const posts = [...new Set(creatorLineage.map(l => l.derivedPostId))];
    return {
      posts,
      remixes: creatorLineage.filter(l => l.lineageType === "remix"),
      derivatives: all.filter(l => posts.includes(l.originalPostId)),
    };
  },
};

// ─── VIRALITY GRAPH ENGINE ────────────────────────────────────────────────────

export const viralityGraphEngine = {
  startChain(originPostId: string, creatorId: number, initialReach: number): ViralChain {
    const id = `viral_${originPostId}_${Date.now()}`;
    const chain: ViralChain = {
      id,
      originPostId,
      chainLinks: [{
        postId: originPostId,
        creatorId,
        shareType: "repost",
        timestamp: new Date(),
        reachAtShare: initialReach,
      }],
      totalReach: initialReach,
      peakVelocity: initialReach,
      duration: 0,
      isActive: true,
      startedAt: new Date(),
    };
    _viralChains.set(id, chain);
    return chain;
  },

  addChainLink(chainId: string, params: {
    postId: string;
    creatorId: number;
    shareType: "repost" | "quote" | "clip" | "external";
    reachAtShare: number;
  }): ViralChain | null {
    const chain = _viralChains.get(chainId);
    if (!chain || !chain.isActive) return null;
    chain.chainLinks.push({ ...params, timestamp: new Date() });
    chain.totalReach += params.reachAtShare;
    chain.duration = (Date.now() - chain.startedAt.getTime()) / 3600000;
    const velocity = params.reachAtShare / Math.max(0.1, chain.duration);
    if (velocity > chain.peakVelocity) chain.peakVelocity = velocity;

    // Update virality score on graph nodes
    const node = _nodes.get(`post_${params.postId}`);
    if (node) {
      node.viralityScore = Math.min(1, chain.totalReach / 100000);
    }

    return chain;
  },

  getActiveChains(limit = 20): ViralChain[] {
    return Array.from(_viralChains.values())
      .filter(c => c.isActive)
      .sort((a, b) => b.peakVelocity - a.peakVelocity)
      .slice(0, limit);
  },

  getTopViralContent(limit = 10): Array<{ postId: string; totalReach: number; peakVelocity: number }> {
    return Array.from(_viralChains.values())
      .sort((a, b) => b.totalReach - a.totalReach)
      .slice(0, limit)
      .map(c => ({ postId: c.originPostId, totalReach: c.totalReach, peakVelocity: c.peakVelocity }));
  },

  computeViralityScore(postId: string): number {
    const chains = Array.from(_viralChains.values()).filter(c => c.originPostId === postId);
    if (chains.length === 0) return 0;
    const totalReach = chains.reduce((s, c) => s + c.totalReach, 0);
    return Math.min(1, totalReach / 100000);
  },

  getViralityDashboard(): {
    activeChains: number;
    totalReachToday: number;
    avgChainLength: number;
    topViralPosts: Array<{ postId: string; totalReach: number }>;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = Array.from(_viralChains.values()).filter(c => c.isActive);
    const todayChains = Array.from(_viralChains.values()).filter(c => c.startedAt >= today);
    return {
      activeChains: active.length,
      totalReachToday: todayChains.reduce((s, c) => s + c.totalReach, 0),
      avgChainLength: active.length > 0
        ? active.reduce((s, c) => s + c.chainLinks.length, 0) / active.length
        : 0,
      topViralPosts: this.getTopViralContent(5),
    };
  },
};

// ─── KNOWLEDGE GRAPH ORCHESTRATOR ────────────────────────────────────────────

export const knowledgeGraphOrchestrator = {
  buildUserGraph(userId: number): GraphQueryResult {
    const nodeId = `user_${userId}`;
    if (!_nodes.has(nodeId)) {
      graphCoreEngine.addNode({ id: nodeId, nodeType: "user", entityId: userId, label: `User ${userId}`, properties: {} });
    }
    return graphCoreEngine.traverseBFS({ startNodeId: nodeId, maxDepth: 2, limit: 50 });
  },

  buildCreatorGraph(creatorId: number): GraphQueryResult {
    const nodeId = `creator_${creatorId}`;
    if (!_nodes.has(nodeId)) {
      graphCoreEngine.addNode({ id: nodeId, nodeType: "creator", entityId: creatorId, label: `Creator ${creatorId}`, properties: {} });
    }
    return graphCoreEngine.traverseBFS({ startNodeId: nodeId, maxDepth: 3, limit: 100 });
  },

  connectUserToCreator(userId: number, creatorId: number, edgeType: EdgeType, weight = 1.0): GraphEdge {
    const userNodeId = `user_${userId}`;
    const creatorNodeId = `creator_${creatorId}`;
    if (!_nodes.has(userNodeId)) {
      graphCoreEngine.addNode({ id: userNodeId, nodeType: "user", entityId: userId, label: `User ${userId}`, properties: {} });
    }
    if (!_nodes.has(creatorNodeId)) {
      graphCoreEngine.addNode({ id: creatorNodeId, nodeType: "creator", entityId: creatorId, label: `Creator ${creatorId}`, properties: {} });
    }
    return graphCoreEngine.addEdge({ fromNodeId: userNodeId, toNodeId: creatorNodeId, edgeType, weight, properties: {} });
  },

  getGraphDashboard(): {
    totalNodes: number;
    totalEdges: number;
    topInfluencers: GraphNode[];
    activeViralChains: number;
    trustNetworkSize: number;
    transactionVolume: { total: number; byType: Record<string, number> };
  } {
    const stats = graphCoreEngine.getGraphStats();
    return {
      totalNodes: stats.nodeCount,
      totalEdges: stats.edgeCount,
      topInfluencers: influenceGraphEngine.getTopInfluencers("creator", 5),
      activeViralChains: viralityGraphEngine.getActiveChains().length,
      trustNetworkSize: _trustPaths.size,
      transactionVolume: transactionGraphEngine.getTransactionVolume(),
    };
  },
};
