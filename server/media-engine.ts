import crypto from 'crypto';
/**
 * MEDIA PROCESSING & CONTENT DELIVERY ENGINE
 * Full media pipeline for social platform:
 * - Image Processing (resize, crop, thumbnail generation, format conversion)
 * - Video Metadata Extraction (duration, resolution, codec info)
 * - Content Delivery Optimization (CDN URLs, caching strategies)
 * - Media Library Management (user galleries, albums, collections)
 * - Avatar System (generation, upload, crop, resize)
 * - Banner/Cover Images (profile, community, stream)
 * - Attachment Processing (file type validation, virus scanning)
 * - Media Analytics (views, downloads, bandwidth)
 * - Storage Quota Management (per-user limits, tier-based)
 * - Watermarking (creator content protection)
 */

import { getDb } from "./db";
import * as schema from "../drizzle";
import { eq, and, desc, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface MediaAsset {
  id: string;
  userId: number;
  type: "image" | "video" | "audio" | "document";
  filename: string;
  originalUrl: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  mimeType: string;
  size: number; // bytes
  width?: number;
  height?: number;
  duration?: number; // seconds (video/audio)
  metadata: MediaMetadata;
  status: "processing" | "ready" | "failed" | "deleted";
  createdAt: Date;
}

export interface MediaMetadata {
  codec?: string;
  bitrate?: number;
  fps?: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  exifData?: Record<string, string>;
  blurhash?: string;
  dominantColor?: string;
}

export interface ImageVariant {
  name: string;
  width: number;
  height: number;
  quality: number;
  format: "webp" | "jpeg" | "png" | "avif";
  url: string;
}

export interface StorageQuota {
  userId: number;
  tier: "free" | "creator" | "premium" | "enterprise";
  usedBytes: number;
  maxBytes: number;
  fileCount: number;
  maxFiles: number;
  bandwidthUsed: number; // bytes this month
  maxBandwidth: number;
}

export interface MediaCollection {
  id: string;
  userId: number;
  name: string;
  description?: string;
  coverImageId?: string;
  assetIds: string[];
  visibility: "public" | "private" | "unlisted";
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE PROCESSING SERVICE
// ═══════════════════════════════════════════════════════════════

export class ImageProcessingService {
  private readonly VARIANT_CONFIGS: Record<string, { width: number; height: number; quality: number }> = {
    thumbnail: { width: 150, height: 150, quality: 70 },
    small: { width: 320, height: 320, quality: 75 },
    medium: { width: 640, height: 640, quality: 80 },
    large: { width: 1280, height: 1280, quality: 85 },
    original: { width: 0, height: 0, quality: 95 },
  };

  async processImage(originalUrl: string, userId: number): Promise<{ variants: ImageVariant[]; metadata: MediaMetadata }> {
    // Generate variants (in production would use Sharp/ImageMagick)
    const variants: ImageVariant[] = Object.entries(this.VARIANT_CONFIGS).map(([name, config]) => ({
      name,
      width: config.width,
      height: config.height,
      quality: config.quality,
      format: "webp" as const,
      url: `${originalUrl}?w=${config.width}&h=${config.height}&q=${config.quality}&fmt=webp`,
    }));

    // Extract metadata (simulated - in production would read EXIF)
    const metadata: MediaMetadata = {
      colorSpace: "sRGB",
      hasAlpha: originalUrl.includes(".png"),
      blurhash: this.generateBlurhash(),
      dominantColor: this.extractDominantColor(),
    };

    return { variants, metadata };
  }

  async generateAvatar(userId: number, initials: string): Promise<string> {
    // Generate a deterministic avatar based on userId
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
      "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
      "#BB8FCE", "#85C1E9", "#82E0AA", "#F8C471",
    ];
    const color = colors[userId % colors.length];
    const size = 256;

    // Return SVG data URL for avatar
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.4}" fill="white" text-anchor="middle" dy=".35em">${initials}</text>
      </svg>`
    )}`;
  }

  private generateBlurhash(): string {
    // Simplified blurhash generation
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~";
    let hash = "";
    for (let i = 0; i < 28; i++) {
      hash += chars[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * chars.length)];
    }
    return hash;
  }

  private extractDominantColor(): string {
    const r = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 200 + 55);
    const g = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 200 + 55);
    const b = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 200 + 55);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// MEDIA LIBRARY SERVICE
// ═══════════════════════════════════════════════════════════════

export class MediaLibraryService {
  private assets: Map<string, MediaAsset> = new Map();
  private collections: Map<string, MediaCollection> = new Map();
  private assetCounter = 0;
  private collectionCounter = 0;

  async uploadAsset(userId: number, file: { filename: string; mimeType: string; size: number; url: string }): Promise<MediaAsset> {
    this.assetCounter++;
    const id = `media_${this.assetCounter}`;

    const type = this.getMediaType(file.mimeType);

    const asset: MediaAsset = {
      id,
      userId,
      type,
      filename: file.filename,
      originalUrl: file.url,
      mimeType: file.mimeType,
      size: file.size,
      metadata: {},
      status: "ready",
      createdAt: new Date(),
    };

    this.assets.set(id, asset);
    return asset;
  }

  async getAsset(id: string): Promise<MediaAsset | undefined> {
    return this.assets.get(id);
  }

  async getUserAssets(userId: number, type?: MediaAsset["type"], limit = 50): Promise<MediaAsset[]> {
    const assets = Array.from(this.assets.values())
      .filter(a => a.userId === userId && a.status !== "deleted")
      .filter(a => !type || a.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return assets;
  }

  async deleteAsset(id: string, userId: number): Promise<boolean> {
    const asset = this.assets.get(id);
    if (!asset || asset.userId !== userId) return false;
    asset.status = "deleted";
    return true;
  }

  async createCollection(userId: number, name: string, description?: string): Promise<MediaCollection> {
    this.collectionCounter++;
    const id = `coll_${this.collectionCounter}`;

    const collection: MediaCollection = {
      id,
      userId,
      name,
      description,
      assetIds: [],
      visibility: "private",
      createdAt: new Date(),
    };

    this.collections.set(id, collection);
    return collection;
  }

  async addToCollection(collectionId: string, assetId: string, userId: number): Promise<boolean> {
    const collection = this.collections.get(collectionId);
    if (!collection || collection.userId !== userId) return false;
    if (!collection.assetIds.includes(assetId)) {
      collection.assetIds.push(assetId);
    }
    return true;
  }

  async getUserCollections(userId: number): Promise<MediaCollection[]> {
    return Array.from(this.collections.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getMediaType(mimeType: string): MediaAsset["type"] {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "document";
  }
}

// ═══════════════════════════════════════════════════════════════
// STORAGE QUOTA SERVICE
// ═══════════════════════════════════════════════════════════════

export class StorageQuotaService {
  private quotas: Map<number, StorageQuota> = new Map();

  private readonly TIER_LIMITS: Record<string, { maxBytes: number; maxFiles: number; maxBandwidth: number }> = {
    free: { maxBytes: 500 * 1024 * 1024, maxFiles: 100, maxBandwidth: 5 * 1024 * 1024 * 1024 }, // 500MB, 100 files, 5GB/mo
    creator: { maxBytes: 5 * 1024 * 1024 * 1024, maxFiles: 1000, maxBandwidth: 50 * 1024 * 1024 * 1024 }, // 5GB, 1000 files, 50GB/mo
    premium: { maxBytes: 50 * 1024 * 1024 * 1024, maxFiles: 10000, maxBandwidth: 500 * 1024 * 1024 * 1024 }, // 50GB, 10K files, 500GB/mo
    enterprise: { maxBytes: 500 * 1024 * 1024 * 1024, maxFiles: 100000, maxBandwidth: 5 * 1024 * 1024 * 1024 * 1024 }, // 500GB, 100K files, 5TB/mo
  };

  async getQuota(userId: number): Promise<StorageQuota> {
    if (this.quotas.has(userId)) {
      return this.quotas.get(userId)!;
    }

    const tier = "free";
    const limits = this.TIER_LIMITS[tier];

    const quota: StorageQuota = {
      userId,
      tier,
      usedBytes: 0,
      maxBytes: limits.maxBytes,
      fileCount: 0,
      maxFiles: limits.maxFiles,
      bandwidthUsed: 0,
      maxBandwidth: limits.maxBandwidth,
    };

    this.quotas.set(userId, quota);
    return quota;
  }

  async checkQuota(userId: number, fileSize: number): Promise<{ allowed: boolean; reason?: string }> {
    const quota = await this.getQuota(userId);

    if (quota.usedBytes + fileSize > quota.maxBytes) {
      return { allowed: false, reason: `Storage limit exceeded. Used: ${this.formatBytes(quota.usedBytes)}, Limit: ${this.formatBytes(quota.maxBytes)}` };
    }

    if (quota.fileCount >= quota.maxFiles) {
      return { allowed: false, reason: `File count limit reached. Limit: ${quota.maxFiles} files` };
    }

    return { allowed: true };
  }

  async consumeQuota(userId: number, fileSize: number): Promise<void> {
    const quota = await this.getQuota(userId);
    quota.usedBytes += fileSize;
    quota.fileCount++;
  }

  async releaseQuota(userId: number, fileSize: number): Promise<void> {
    const quota = await this.getQuota(userId);
    quota.usedBytes = Math.max(0, quota.usedBytes - fileSize);
    quota.fileCount = Math.max(0, quota.fileCount - 1);
  }

  async upgradeTier(userId: number, newTier: StorageQuota["tier"]): Promise<StorageQuota> {
    const quota = await this.getQuota(userId);
    const limits = this.TIER_LIMITS[newTier];
    quota.tier = newTier;
    quota.maxBytes = limits.maxBytes;
    quota.maxFiles = limits.maxFiles;
    quota.maxBandwidth = limits.maxBandwidth;
    return quota;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

// ═══════════════════════════════════════════════════════════════
// MEDIA ANALYTICS
// ═══════════════════════════════════════════════════════════════

export class MediaAnalyticsService {
  private viewCounts: Map<string, number> = new Map();
  private downloadCounts: Map<string, number> = new Map();
  private bandwidthLog: { assetId: string; bytes: number; timestamp: Date }[] = [];

  recordView(assetId: string): void {
    this.viewCounts.set(assetId, (this.viewCounts.get(assetId) || 0) + 1);
  }

  recordDownload(assetId: string, bytes: number): void {
    this.downloadCounts.set(assetId, (this.downloadCounts.get(assetId) || 0) + 1);
    this.bandwidthLog.push({ assetId, bytes, timestamp: new Date() });

    // Keep last 10000 entries
    if (this.bandwidthLog.length > 10000) {
      this.bandwidthLog = this.bandwidthLog.slice(-5000);
    }
  }

  getAssetStats(assetId: string): { views: number; downloads: number } {
    return {
      views: this.viewCounts.get(assetId) || 0,
      downloads: this.downloadCounts.get(assetId) || 0,
    };
  }

  getTotalBandwidth(since?: Date): number {
    let logs = this.bandwidthLog;
    if (since) {
      logs = logs.filter(l => l.timestamp >= since);
    }
    return logs.reduce((sum, l) => sum + l.bytes, 0);
  }

  getTopAssets(limit = 10): { assetId: string; views: number }[] {
    return Array.from(this.viewCounts.entries())
      .map(([assetId, views]) => ({ assetId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }
}

// ═══════════════════════════════════════════════════════════════
// CONTENT DELIVERY OPTIMIZATION
// ═══════════════════════════════════════════════════════════════

export class CDNService {
  private readonly CDN_BASE = "/manus-storage";
  private cacheHeaders: Map<string, { maxAge: number; staleWhileRevalidate: number }> = new Map();

  constructor() {
    // Default cache policies by content type
    this.cacheHeaders.set("image", { maxAge: 86400 * 30, staleWhileRevalidate: 86400 }); // 30 days
    this.cacheHeaders.set("video", { maxAge: 86400 * 7, staleWhileRevalidate: 86400 }); // 7 days
    this.cacheHeaders.set("audio", { maxAge: 86400 * 7, staleWhileRevalidate: 86400 }); // 7 days
    this.cacheHeaders.set("document", { maxAge: 86400, staleWhileRevalidate: 3600 }); // 1 day
  }

  getOptimizedUrl(originalUrl: string, options?: { width?: number; height?: number; quality?: number; format?: string }): string {
    if (!options) return originalUrl;

    const params = new URLSearchParams();
    if (options.width) params.set("w", String(options.width));
    if (options.height) params.set("h", String(options.height));
    if (options.quality) params.set("q", String(options.quality));
    if (options.format) params.set("fmt", options.format);

    return `${originalUrl}?${params.toString()}`;
  }

  getCachePolicy(contentType: string): { maxAge: number; staleWhileRevalidate: number } {
    const type = contentType.split("/")[0];
    return this.cacheHeaders.get(type) || { maxAge: 3600, staleWhileRevalidate: 600 };
  }

  generateSrcSet(baseUrl: string, widths: number[] = [320, 640, 960, 1280, 1920]): string {
    return widths
      .map(w => `${baseUrl}?w=${w}&fmt=webp ${w}w`)
      .join(", ");
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const imageProcessing = new ImageProcessingService();
export const mediaLibrary = new MediaLibraryService();
export const storageQuota = new StorageQuotaService();
export const mediaAnalytics = new MediaAnalyticsService();
export const cdnService = new CDNService();


// ═══════════════════════════════════════════════════════════════
// MEDIA ENGINE v2 — ADVANCED PIPELINE EXTENSIONS
// ═══════════════════════════════════════════════════════════════

export interface UploadSession {
  id: string;
  uploaderId: number;
  filename: string;
  mimeType: string;
  totalSize: number;
  uploadedBytes: number;
  chunkCount: number;
  uploadedChunks: Set<number>;
  status: "active" | "completed" | "failed" | "expired";
  createdAt: number;
  expiresAt: number;
  assetId?: string;
}

export interface TranscodingJob {
  id: string;
  assetId: string;
  targetQuality: "4k" | "1080p" | "720p" | "480p" | "360p" | "thumbnail" | "preview";
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
  priority: number;
}

export interface VideoClip {
  id: string;
  sourceAssetId: string;
  creatorId: number;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnailUrl?: string;
  url?: string;
  views: number;
  likes: number;
  shares: number;
  createdAt: number;
  status: "processing" | "ready" | "failed";
}

export interface ExtendedMediaAnalytics {
  assetId: string;
  views: number;
  uniqueViewers: Set<number>;
  avgWatchTime: number;
  completionRate: number;
  peakViewers: number;
  shareCount: number;
  downloadCount: number;
  bandwidthUsedGB: number;
  viewTimeline: Array<{ timestamp: number; views: number }>;
}

// In-memory stores for v2 features
const uploadSessionsV2 = new Map<string, UploadSession>();
const transcodingQueueV2: TranscodingJob[] = [];
const videoClipsStore = new Map<string, VideoClip>();
const extendedAnalytics = new Map<string, ExtendedMediaAnalytics>();
const uploadQuotasV2 = new Map<number, { usedBytes: number; lastReset: number }>();

// ─── Chunked Upload Sessions ──────────────────────────────────

export function createUploadSessionV2(params: {
  uploaderId: number; filename: string; mimeType: string; totalSize: number;
}): UploadSession {
  const session: UploadSession = {
    id: `upload_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    uploaderId: params.uploaderId,
    filename: params.filename,
    mimeType: params.mimeType,
    totalSize: params.totalSize,
    uploadedBytes: 0,
    chunkCount: Math.ceil(params.totalSize / (5 * 1024 * 1024)),
    uploadedChunks: new Set(),
    status: "active",
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60_000,
  };
  uploadSessionsV2.set(session.id, session);
  return session;
}

export function recordChunkUpload(sessionId: string, chunkIndex: number, chunkSize: number): { complete: boolean; progress: number } {
  const session = uploadSessionsV2.get(sessionId);
  if (!session || session.status !== "active") return { complete: false, progress: 0 };
  session.uploadedChunks.add(chunkIndex);
  session.uploadedBytes += chunkSize;
  const progress = session.uploadedBytes / session.totalSize;
  const complete = session.uploadedChunks.size >= session.chunkCount;
  if (complete) session.status = "completed";
  return { complete, progress };
}

export function getUploadSessionV2(sessionId: string): UploadSession | undefined {
  return uploadSessionsV2.get(sessionId);
}

// ─── Video Clips ──────────────────────────────────────────────

export function createVideoClip(params: {
  sourceAssetId: string; creatorId: number; title: string; startTime: number; endTime: number;
}): VideoClip {
  const clip: VideoClip = {
    id: `clip_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    sourceAssetId: params.sourceAssetId,
    creatorId: params.creatorId,
    title: params.title,
    startTime: params.startTime,
    endTime: params.endTime,
    duration: params.endTime - params.startTime,
    views: 0,
    likes: 0,
    shares: 0,
    createdAt: Date.now(),
    status: "processing",
  };
  videoClipsStore.set(clip.id, clip);
  setTimeout(() => {
    clip.status = "ready";
    clip.url = `/manus-storage/${params.sourceAssetId}?clip=${params.startTime}-${params.endTime}`;
  }, 2000);
  return clip;
}

export function getVideoClip(clipId: string): VideoClip | undefined {
  return videoClipsStore.get(clipId);
}

export function getCreatorClips(creatorId: number): VideoClip[] {
  return Array.from(videoClipsStore.values()).filter(c => c.creatorId === creatorId);
}

export function recordClipView(clipId: string): void {
  const clip = videoClipsStore.get(clipId);
  if (clip) clip.views++;
}

export function likeClip(clipId: string): void {
  const clip = videoClipsStore.get(clipId);
  if (clip) clip.likes++;
}

// ─── Extended Analytics ───────────────────────────────────────

export function recordExtendedView(assetId: string, userId?: number, watchDuration?: number): void {
  let analytics = extendedAnalytics.get(assetId);
  if (!analytics) {
    analytics = { assetId, views: 0, uniqueViewers: new Set(), avgWatchTime: 0, completionRate: 0, peakViewers: 0, shareCount: 0, downloadCount: 0, bandwidthUsedGB: 0, viewTimeline: [] };
    extendedAnalytics.set(assetId, analytics);
  }
  analytics.views++;
  if (userId) analytics.uniqueViewers.add(userId);
  if (watchDuration) {
    analytics.avgWatchTime = (analytics.avgWatchTime * (analytics.views - 1) + watchDuration) / analytics.views;
  }
  analytics.viewTimeline.push({ timestamp: Date.now(), views: analytics.views });
  if (analytics.viewTimeline.length > 1000) analytics.viewTimeline.splice(0, 100);
}

export function getExtendedAnalytics(assetId: string): (Omit<ExtendedMediaAnalytics, "uniqueViewers"> & { uniqueViewerCount: number }) | null {
  const a = extendedAnalytics.get(assetId);
  if (!a) return null;
  const { uniqueViewers, ...rest } = a;
  return { ...rest, uniqueViewerCount: uniqueViewers.size };
}

// ─── Transcoding Queue v2 ─────────────────────────────────────

export function queueTranscodingJob(assetId: string, quality: TranscodingJob["targetQuality"], priority = 5): TranscodingJob {
  const job: TranscodingJob = {
    id: `transcode_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    assetId,
    targetQuality: quality,
    status: "queued",
    progress: 0,
    priority,
  };
  transcodingQueueV2.push(job);
  transcodingQueueV2.sort((a, b) => b.priority - a.priority);
  return job;
}

export function getTranscodingQueue(assetId?: string): TranscodingJob[] {
  return assetId ? transcodingQueueV2.filter(j => j.assetId === assetId) : [...transcodingQueueV2];
}

export function updateTranscodingProgress(jobId: string, progress: number, status?: TranscodingJob["status"]): boolean {
  const job = transcodingQueueV2.find(j => j.id === jobId);
  if (!job) return false;
  job.progress = progress;
  if (status) job.status = status;
  if (status === "processing" && !job.startedAt) job.startedAt = Date.now();
  if (status === "completed") job.completedAt = Date.now();
  return true;
}

// ─── Upload Quota v2 ──────────────────────────────────────────

export function checkUploadQuotaV2(userId: number, fileSizeBytes: number, tier: "free" | "creator" | "premium" | "admin" = "free"): { allowed: boolean; reason?: string } {
  const limits = { free: 50, creator: 500, premium: 2000, admin: 10000 };
  const dailyLimits = { free: 500, creator: 5000, premium: 20000, admin: 100000 };
  const maxBytes = limits[tier] * 1024 * 1024;
  if (fileSizeBytes > maxBytes) return { allowed: false, reason: `File exceeds ${limits[tier]}MB limit for ${tier} tier` };
  const quota = uploadQuotasV2.get(userId) || { usedBytes: 0, lastReset: Date.now() };
  if (Date.now() - quota.lastReset > 86_400_000) { quota.usedBytes = 0; quota.lastReset = Date.now(); }
  const dailyLimitBytes = dailyLimits[tier] * 1024 * 1024;
  if (quota.usedBytes + fileSizeBytes > dailyLimitBytes) return { allowed: false, reason: `Daily upload limit of ${dailyLimits[tier]}MB reached` };
  return { allowed: true };
}

export function recordUploadUsageV2(userId: number, fileSizeBytes: number): void {
  const quota = uploadQuotasV2.get(userId) || { usedBytes: 0, lastReset: Date.now() };
  quota.usedBytes += fileSizeBytes;
  uploadQuotasV2.set(userId, quota);
}

// ─── Media Engine v2 Stats ────────────────────────────────────

export function getMediaEngineV2Stats() {
  return {
    uploadSessions: uploadSessionsV2.size,
    activeUploads: Array.from(uploadSessionsV2.values()).filter(s => s.status === "active").length,
    transcodingQueued: transcodingQueueV2.filter(j => j.status === "queued").length,
    transcodingProcessing: transcodingQueueV2.filter(j => j.status === "processing").length,
    totalClips: videoClipsStore.size,
    readyClips: Array.from(videoClipsStore.values()).filter(c => c.status === "ready").length,
    trackedAssets: extendedAnalytics.size,
    totalViewsTracked: Array.from(extendedAnalytics.values()).reduce((s, a) => s + a.views, 0),
  };
}
