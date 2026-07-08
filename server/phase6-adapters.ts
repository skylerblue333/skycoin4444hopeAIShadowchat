/**
 * Phase 6-9 Adapters
 * Typed adapter objects for all Phase 6, 7, 8, and 9 engines.
 * These are the single-import surface for TRPC routers and tests.
 */

// ── Phase 6A: Creator OS Engine ───────────────────────────────────────────────
export {
  creatorCRM,
  audienceSegmentation,
  subscriberFunnels,
  sponsorshipCRM,
  campaignManager,
  merchAnalytics,
  revenueForecasting,
  contentPlanner,
  contentScheduler,
  creatorBI,
  creatorTaxCenter,
  legalDocsVault,
} from "./creator-os-engine";

// ── Phase 6B: Audience Lock-In Engine ─────────────────────────────────────────
export {
  streakSystem,
  loyaltySystem,
  fanBadges,
  fanSubscriptions,
  milestoneRewards,
  fanQuests,
  fanLeveling,
  supporterLadders,
  collectibleFanNFTs,
} from "./audience-lockin-engine";

// ── Phase 6C: Live Event Engine ───────────────────────────────────────────────
export {
  liveEventEngine,
  eventLeaderboards,
  liveRaffles,
  eventMerchDrops,
  premiumSpaces,
} from "./live-event-engine";

// ── Phase 6D-6I ───────────────────────────────────────────────────────────────
export {
  creatorLoans,
  communityGrants,
  stakingMultipliers,
  adRevenueSharing,
  loyaltyTokenRewards,
  treasuryGrants,
  affiliateCompounding,
  hopeAI,
  discoveryEngine,
  businessIntelligence,
  globalExpansion,
  trustEmpire,
} from "./phase6-engines";

// ── Phase 7 ───────────────────────────────────────────────────────────────────
export {
  developerPlatform,
  pluginSystem,
  businessLayer,
  brandEconomy,
  educationExpansion,
  financialExpansion,
  partnershipInfrastructure,
  governanceExpansion,
  identityExpansion,
  enterpriseInfrastructure,
} from "./phase7-engines";

// ── Phase 8 ───────────────────────────────────────────────────────────────────
export {
  universalEconomy,
  universalIdentity,
  aiOrchestration,
  universalSearch,
  universalMessaging,
  universalEvents,
  appEcosystem,
  globalIntelligence,
  resilienceLayer,
} from "./phase8-engines";

// ── Phase 9 ───────────────────────────────────────────────────────────────────
export {
  reliabilityEngine,
  observabilityEngine,
  performanceEngine,
  securityHardening,
  dataIntegrity,
  financialFinalization,
  aiReliability,
  scalabilityEngine,
  complianceEngine,
} from "./phase9-engines";
