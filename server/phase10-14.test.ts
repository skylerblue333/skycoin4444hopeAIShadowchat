/**
 * Phase 10-14 Test Suite
 * Global Expansion | Enterprise | Autonomous Economy | AI Civilization | Platform Permanence
 * Target: 200+ tests across 14 engine modules
 */

import { describe, it, expect, beforeEach } from "vitest";

// ── Phase 10: Global Expansion ────────────────────────────────────────────────
import {
  localizationEngine,
  regionalEconomy,
  globalDiscovery,
  internationalCompliance,
} from "./phase10-global-expansion";

// ── Phase 11: Enterprise & Institutional ─────────────────────────────────────
import {
  enterpriseControls,
  institutionLayer,
  whiteLabelLayer,
} from "./phase11-enterprise";

// ── Phase 12: Autonomous Economy ─────────────────────────────────────────────
import {
  economicIntelligence,
  autonomousRevenue,
  economicRisk,
} from "./phase12-autonomous-economy";

// ── Phase 13: AI Civilization ─────────────────────────────────────────────────
import {
  hopeMultiAgentNetwork,
  autonomousOperations,
  intelligenceMemory,
} from "./phase13-ai-civilization";

// ── Phase 14: Platform Permanence ─────────────────────────────────────────────
import {
  durabilityLayer,
  governancePermanence,
  legacySystems,
  disasterRecovery,
} from "./phase14-permanence";

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10: GLOBAL EXPANSION
// ═══════════════════════════════════════════════════════════════════════════════

describe("Phase 10A: Localization Engine", () => {
  it("returns supported locales", () => {
    const locales = localizationEngine.getSupportedLocales();
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThan(0);
    expect(locales[0]).toHaveProperty("code");
    expect(locales[0]).toHaveProperty("name");
  });

  it("gets locale config for a specific locale", () => {
    const config = localizationEngine.getLocaleConfig("en");
    expect(config).not.toBeNull();
    expect(config?.code).toBe("en");
    expect(config).toHaveProperty("currency");
    expect(config).toHaveProperty("timezone");
  });

  it("detects locale from browser headers", () => {
    const detected = localizationEngine.detectLocale("en-US,en;q=0.9,es;q=0.8", "US");
    expect(detected).toHaveProperty("locale");
    expect(detected).toHaveProperty("confidence");
    expect(detected.confidence).toBeGreaterThan(0);
  });

  it("translates content to target language", () => {
    const result = localizationEngine.translateContent("Hello world", "en", "es");
    expect(result).toHaveProperty("translated");
    expect(result).toHaveProperty("sourceLanguage");
    expect(result).toHaveProperty("targetLanguage");
    expect(result.targetLanguage).toBe("es");
  });

  it("formats currency for a locale", () => {
    const formatted = localizationEngine.formatCurrency(1234.56, "USD", "en");
    expect(typeof formatted).toBe("string");
    expect(formatted).toContain("1");
  });

  it("formats date for a locale", () => {
    const date = new Date("2024-01-15");
    const formatted = localizationEngine.formatDate(date, "en");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("gets RTL locales", () => {
    const rtl = localizationEngine.getRTLLocales();
    expect(Array.isArray(rtl)).toBe(true);
    // Arabic and Hebrew should be RTL
    expect(rtl.some(l => l.code === "ar" || l.code === "he")).toBe(true);
  });

  it("gets localization stats", () => {
    const stats = localizationEngine.getLocalizationStats();
    expect(stats).toHaveProperty("totalLocales");
    expect(stats).toHaveProperty("rtlLocales");
    expect(stats.totalLocales).toBeGreaterThan(0);
  });
});

describe("Phase 10B: Regional Economy", () => {
  it("creates a regional pricing tier", () => {
    const tier = regionalEconomy.createRegionalPricing("LATAM", "USD", 0.6, ["AR", "BR", "MX"]);
    expect(tier).toHaveProperty("region");
    expect(tier.region).toBe("LATAM");
    expect(tier).toHaveProperty("currency");
    expect(tier).toHaveProperty("pricingFactor");
    expect(tier.pricingFactor).toBe(0.6);
  });

  it("gets regional pricing for a country", () => {
    const pricing = regionalEconomy.getRegionalPricing("BR");
    expect(pricing).not.toBeNull();
    expect(pricing).toHaveProperty("region");
    expect(pricing).toHaveProperty("pricingFactor");
  });

  it("calculates regional price for a product", () => {
    const price = regionalEconomy.calculateRegionalPrice(100, "BR");
    expect(typeof price).toBe("number");
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThanOrEqual(100);
  });

  it("creates a regional payment method", () => {
    const method = regionalEconomy.addPaymentMethod("LATAM", "PIX", ["BR"], true);
    expect(method).toHaveProperty("region");
    expect(method).toHaveProperty("method");
    expect(method.method).toBe("PIX");
    expect(method.isActive).toBe(true);
  });

  it("gets payment methods for a country", () => {
    const methods = regionalEconomy.getPaymentMethods("BR");
    expect(Array.isArray(methods)).toBe(true);
    expect(methods.length).toBeGreaterThan(0);
  });

  it("creates a regional tax config", () => {
    const tax = regionalEconomy.setTaxConfig("BR", "digital_services", 0.17, "ICMS");
    expect(tax).toHaveProperty("country");
    expect(tax.country).toBe("BR");
    expect(tax).toHaveProperty("taxType");
    expect(tax).toHaveProperty("rate");
  });

  it("calculates tax for a transaction", () => {
    const result = regionalEconomy.calculateTax(100, "BR", "digital_services");
    expect(result).toHaveProperty("baseAmount");
    expect(result).toHaveProperty("taxAmount");
    expect(result).toHaveProperty("totalAmount");
    expect(result.totalAmount).toBeGreaterThan(result.baseAmount);
  });

  it("gets regional economy stats", () => {
    const stats = regionalEconomy.getRegionalStats();
    expect(stats).toHaveProperty("totalRegions");
    expect(stats).toHaveProperty("totalPaymentMethods");
    expect(stats.totalRegions).toBeGreaterThan(0);
  });
});

describe("Phase 10C: Global Discovery", () => {
  it("indexes a piece of content globally", () => {
    const indexed = globalDiscovery.indexContent("post", "p-1001", "Hello from Brazil!", ["pt", "en"], ["BR", "LATAM"]);
    expect(indexed).toHaveProperty("contentId");
    expect(indexed.contentId).toBe("p-1001");
    expect(indexed).toHaveProperty("languages");
    expect(indexed).toHaveProperty("regions");
  });

  it("searches globally with language filter", () => {
    const results = globalDiscovery.search("Hello", { language: "en", limit: 10 });
    expect(results).toHaveProperty("results");
    expect(results).toHaveProperty("total");
    expect(Array.isArray(results.results)).toBe(true);
  });

  it("gets trending content by region", () => {
    const trending = globalDiscovery.getTrendingByRegion("BR", 5);
    expect(Array.isArray(trending)).toBe(true);
  });

  it("gets trending content by language", () => {
    const trending = globalDiscovery.getTrendingByLanguage("pt", 5);
    expect(Array.isArray(trending)).toBe(true);
  });

  it("records a content view for regional analytics", () => {
    globalDiscovery.recordView("p-1001", "BR", "pt");
    const trending = globalDiscovery.getTrendingByRegion("BR", 10);
    expect(Array.isArray(trending)).toBe(true);
  });

  it("gets global discovery stats", () => {
    const stats = globalDiscovery.getDiscoveryStats();
    expect(stats).toHaveProperty("totalIndexed");
    expect(stats).toHaveProperty("totalLanguages");
    expect(stats).toHaveProperty("totalRegions");
  });
});

describe("Phase 10D: International Compliance", () => {
  it("creates a GDPR consent record", () => {
    const consent = internationalCompliance.recordConsent(7001, "GDPR", ["analytics", "marketing"], "1.0");
    expect(consent).toHaveProperty("userId");
    expect(consent.userId).toBe(7001);
    expect(consent).toHaveProperty("framework");
    expect(consent.framework).toBe("GDPR");
    expect(consent).toHaveProperty("purposes");
  });

  it("gets consent for a user", () => {
    const consent = internationalCompliance.getConsent(7001, "GDPR");
    expect(consent).not.toBeNull();
    expect(consent?.userId).toBe(7001);
  });

  it("withdraws consent", () => {
    const result = internationalCompliance.withdrawConsent(7001, "GDPR", ["marketing"]);
    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });

  it("creates a data residency rule", () => {
    const rule = internationalCompliance.setDataResidencyRule("EU", ["user_data", "financial_data"], ["EU-WEST-1", "EU-CENTRAL-1"]);
    expect(rule).toHaveProperty("region");
    expect(rule.region).toBe("EU");
    expect(rule).toHaveProperty("dataTypes");
    expect(rule).toHaveProperty("allowedRegions");
  });

  it("checks data residency compliance", () => {
    const check = internationalCompliance.checkDataResidency("user_data", "EU-WEST-1", "EU");
    expect(check).toHaveProperty("compliant");
    expect(check.compliant).toBe(true);
  });

  it("creates a cross-border transfer assessment", () => {
    const assessment = internationalCompliance.assessCrossBorderTransfer("user_data", "EU", "US", "standard_clauses");
    expect(assessment).toHaveProperty("approved");
    expect(assessment).toHaveProperty("mechanism");
    expect(assessment.mechanism).toBe("standard_clauses");
  });

  it("gets compliance dashboard", () => {
    const dashboard = internationalCompliance.getComplianceDashboard();
    expect(dashboard).toHaveProperty("totalConsents");
    expect(dashboard).toHaveProperty("gdprCompliant");
    expect(dashboard).toHaveProperty("ccpaCompliant");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 11: ENTERPRISE & INSTITUTIONAL
// ═══════════════════════════════════════════════════════════════════════════════

describe("Phase 11A: Enterprise Controls", () => {
  let orgId: string;

  it("creates an enterprise organization", () => {
    const org = enterpriseControls.createOrg("Acme Corp", "acme.com", "enterprise", 500);
    expect(org).toHaveProperty("id");
    expect(org).toHaveProperty("name");
    expect(org.name).toBe("Acme Corp");
    expect(org).toHaveProperty("domain");
    expect(org).toHaveProperty("plan");
    orgId = org.id;
  });

  it("gets an organization by ID", () => {
    const org = enterpriseControls.getOrg(orgId);
    expect(org).not.toBeNull();
    expect(org?.id).toBe(orgId);
  });

  it("creates a role with permissions", () => {
    const role = enterpriseControls.createRole(orgId, "Content Manager", ["post:create", "post:delete", "community:manage"]);
    expect(role).toHaveProperty("id");
    expect(role).toHaveProperty("name");
    expect(role.name).toBe("Content Manager");
    expect(role).toHaveProperty("permissions");
    expect(role.permissions).toContain("post:create");
  });

  it("assigns a role to a user", () => {
    const role = enterpriseControls.createRole(orgId, "Viewer", ["post:read"]);
    const assignment = enterpriseControls.assignRole(9001, orgId, role.id, 1);
    expect(assignment).toHaveProperty("userId");
    expect(assignment.userId).toBe(9001);
    expect(assignment).toHaveProperty("roleId");
  });

  it("gets user permissions", () => {
    const role = enterpriseControls.createRole(orgId, "Editor", ["post:create", "post:edit"]);
    enterpriseControls.assignRole(9002, orgId, role.id, 1);
    const permissions = enterpriseControls.getUserPermissions(9002, orgId);
    expect(Array.isArray(permissions)).toBe(true);
    expect(permissions).toContain("post:create");
  });

  it("checks if user has a specific permission", () => {
    const role = enterpriseControls.createRole(orgId, "Admin", ["admin:all", "post:delete"]);
    enterpriseControls.assignRole(9003, orgId, role.id, 1);
    const hasPermission = enterpriseControls.hasPermission(9003, orgId, "post:delete");
    expect(hasPermission).toBe(true);
    const noPermission = enterpriseControls.hasPermission(9003, orgId, "billing:manage");
    expect(noPermission).toBe(false);
  });

  it("requests an audit export", () => {
    const exportRecord = enterpriseControls.requestAuditExport(orgId, 1, "json", { from: new Date(Date.now() - 86400000), to: new Date() });
    expect(exportRecord).toHaveProperty("id");
    expect(exportRecord).toHaveProperty("orgId");
    expect(exportRecord.orgId).toBe(orgId);
    expect(exportRecord).toHaveProperty("format");
    expect(exportRecord.format).toBe("json");
  });

  it("configures SSO for an organization", () => {
    const org = enterpriseControls.configureSso(orgId, "saml", { entityId: "acme-saml", ssoUrl: "https://sso.acme.com" });
    expect(org).toHaveProperty("ssoProvider");
    expect(org.ssoProvider).toBe("saml");
  });
});

describe("Phase 11B: Institution Layer", () => {
  let institutionId: string;

  it("registers an institution", () => {
    const institution = institutionLayer.registerInstitution("MIT", "university", "mit.edu", "US");
    expect(institution).toHaveProperty("id");
    expect(institution).toHaveProperty("name");
    expect(institution.name).toBe("MIT");
    expect(institution).toHaveProperty("type");
    expect(institution.type).toBe("university");
    institutionId = institution.id;
  });

  it("verifies an institution", () => {
    const verified = institutionLayer.verifyInstitution(institutionId);
    expect(verified).toHaveProperty("verified");
    expect(verified.verified).toBe(true);
  });

  it("gets an institution by ID", () => {
    const institution = institutionLayer.getInstitution(institutionId);
    expect(institution).not.toBeNull();
    expect(institution?.id).toBe(institutionId);
  });

  it("gets institutions by type", () => {
    institutionLayer.registerInstitution("Harvard", "university", "harvard.edu", "US");
    const universities = institutionLayer.getInstitutionsByType("university");
    expect(Array.isArray(universities)).toBe(true);
    expect(universities.length).toBeGreaterThanOrEqual(2);
  });

  it("creates a school system", () => {
    const school = institutionLayer.createSchoolSystem(institutionId, "MIT K-12 Program", "K-12", 1200, 80);
    expect(school).toHaveProperty("id");
    expect(school).toHaveProperty("name");
    expect(school.name).toBe("MIT K-12 Program");
    expect(school).toHaveProperty("studentCount");
  });

  it("creates a research community", () => {
    const community = institutionLayer.createResearchCommunity(institutionId, "AI Research Lab", "Artificial Intelligence", true);
    expect(community).toHaveProperty("id");
    expect(community).toHaveProperty("name");
    expect(community.name).toBe("AI Research Lab");
    expect(community).toHaveProperty("openAccess");
    expect(community.openAccess).toBe(true);
  });

  it("joins a research community", () => {
    const community = institutionLayer.createResearchCommunity(institutionId, "Quantum Lab", "Quantum Computing", false);
    const joined = institutionLayer.joinResearchCommunity(community.id, 8001);
    expect(joined).toHaveProperty("members");
    expect(joined.members).toContain(8001);
  });

  it("gets institution analytics", () => {
    const analytics = institutionLayer.getInstitutionAnalytics(institutionId);
    expect(analytics).toHaveProperty("members");
    expect(analytics).toHaveProperty("engagement");
    expect(analytics).toHaveProperty("contentCreated");
    expect(analytics).toHaveProperty("revenueGenerated");
  });
});

describe("Phase 11C: White Label Layer", () => {
  let instanceId: string;

  it("creates a white label instance", () => {
    const instance = whiteLabelLayer.createInstance("org-wl-1", "MyBrand Social", "mybrand.social", "professional");
    expect(instance).toHaveProperty("id");
    expect(instance).toHaveProperty("name");
    expect(instance.name).toBe("MyBrand Social");
    expect(instance).toHaveProperty("domain");
    expect(instance.domain).toBe("mybrand.social");
    instanceId = instance.id;
  });

  it("gets an instance by ID", () => {
    const instance = whiteLabelLayer.getInstance(instanceId);
    expect(instance).not.toBeNull();
    expect(instance?.id).toBe(instanceId);
  });

  it("updates branding for an instance", () => {
    const updated = whiteLabelLayer.updateBranding(instanceId, { primaryColor: "#FF6B35", logo: "https://cdn.mybrand.social/logo.png" });
    expect(updated).toHaveProperty("branding");
    expect(updated.branding.primaryColor).toBe("#FF6B35");
  });

  it("enables a feature for an instance", () => {
    const updated = whiteLabelLayer.enableFeature(instanceId, "streaming");
    expect(updated.features).toContain("streaming");
  });

  it("disables a feature for an instance", () => {
    whiteLabelLayer.enableFeature(instanceId, "nft_marketplace");
    const updated = whiteLabelLayer.disableFeature(instanceId, "nft_marketplace");
    expect(updated.features).not.toContain("nft_marketplace");
  });

  it("creates a partner deployment", () => {
    const deployment = whiteLabelLayer.createPartnerDeployment("partner-1", instanceId, "us-east-1", "premium");
    expect(deployment).toHaveProperty("id");
    expect(deployment).toHaveProperty("partnerId");
    expect(deployment.partnerId).toBe("partner-1");
    expect(deployment).toHaveProperty("tier");
    expect(deployment.tier).toBe("premium");
  });

  it("gets white label stats", () => {
    const stats = whiteLabelLayer.getWhiteLabelStats();
    expect(stats).toHaveProperty("totalInstances");
    expect(stats).toHaveProperty("activeInstances");
    expect(stats.totalInstances).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 12: AUTONOMOUS ECONOMY
// ═══════════════════════════════════════════════════════════════════════════════

describe("Phase 12A: Economic Intelligence", () => {
  it("gets creator economy balance", () => {
    const balance = economicIntelligence.getCreatorEconomyBalance();
    expect(balance).toHaveProperty("totalCreatorEarnings");
    expect(balance).toHaveProperty("totalPlatformRevenue");
    expect(balance).toHaveProperty("creatorShare");
    expect(balance).toHaveProperty("platformShare");
    expect(balance).toHaveProperty("healthScore");
  });

  it("gets token inflation metrics", () => {
    const metrics = economicIntelligence.getTokenInflationMetrics();
    expect(metrics).toHaveProperty("currentRate");
    expect(metrics).toHaveProperty("targetRate");
    expect(metrics).toHaveProperty("totalSupply");
    expect(metrics).toHaveProperty("circulatingSupply");
  });

  it("adjusts inflation rate", () => {
    const updated = economicIntelligence.adjustInflationRate(0.03);
    expect(updated.currentRate).toBe(0.03);
  });

  it("burns tokens and reduces supply", () => {
    const before = economicIntelligence.getTokenInflationMetrics();
    const after = economicIntelligence.burnTokens(1000000);
    expect(after.totalSupply).toBeLessThan(before.totalSupply);
    expect(after.burnedTokens).toBeGreaterThan(0);
  });

  it("gets NFT economy metrics", () => {
    const metrics = economicIntelligence.getNFTEconomyMetrics();
    expect(metrics).toHaveProperty("totalNFTs");
    expect(metrics).toHaveProperty("totalVolume");
    expect(metrics).toHaveProperty("avgPrice");
    expect(metrics).toHaveProperty("activeCollections");
  });

  it("gets staking reward config for a tier", () => {
    const config = economicIntelligence.getStakingRewardConfig("gold");
    expect(config).not.toBeNull();
    expect(config?.tier).toBe("gold");
    expect(config).toHaveProperty("baseAPY");
    expect(config).toHaveProperty("multiplier");
  });

  it("adjusts staking rewards for a tier", () => {
    const updated = economicIntelligence.adjustStakingRewards("gold", 1.2);
    expect(updated.tier).toBe("gold");
    expect(updated.multiplier).toBeGreaterThan(1);
  });

  it("gets all treasury balances", () => {
    const balances = economicIntelligence.getAllTreasuryBalances();
    expect(Array.isArray(balances)).toBe(true);
  });

  it("rebalances a treasury region", () => {
    const result = economicIntelligence.rebalanceTreasury("US");
    expect(result).toHaveProperty("region");
    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("amount");
  });

  it("optimizes marketplace fees for a category", () => {
    const config = economicIntelligence.optimizeMarketplaceFees("art");
    expect(config).toHaveProperty("category");
    expect(config.category).toBe("art");
    expect(config).toHaveProperty("platformFee");
    expect(config).toHaveProperty("creatorRoyalty");
  });
});

describe("Phase 12B: Autonomous Revenue", () => {
  it("optimizes sponsorship pricing for a creator", () => {
    const pricing = autonomousRevenue.optimizeSponsorshipPricing(
      3001, "standard", 500,
      { followers: 50000, engagementRate: 0.05, avgViews: 10000 }
    );
    expect(pricing).toHaveProperty("creatorId");
    expect(pricing.creatorId).toBe(3001);
    expect(pricing).toHaveProperty("recommendedPrice");
    expect(pricing.recommendedPrice).toBeGreaterThan(0);
    expect(pricing).toHaveProperty("tier");
  });

  it("gets sponsorship pricing for a creator", () => {
    const pricing = autonomousRevenue.getSponsorshipPricing(3001);
    expect(pricing).not.toBeNull();
    expect(pricing?.creatorId).toBe(3001);
  });

  it("generates revenue projection for a creator", () => {
    const projection = autonomousRevenue.getRevenueProjection(3001, 6);
    expect(Array.isArray(projection)).toBe(true);
    expect(projection.length).toBe(6);
    expect(projection[0]).toHaveProperty("month");
    expect(projection[0]).toHaveProperty("projectedRevenue");
    expect(projection[0]).toHaveProperty("confidence");
  });

  it("generates treasury yield strategy", () => {
    const strategy = autonomousRevenue.generateTreasuryYieldStrategy(1000000, "medium");
    expect(strategy).toHaveProperty("totalBalance");
    expect(strategy).toHaveProperty("expectedAPY");
    expect(strategy).toHaveProperty("allocations");
    expect(Array.isArray(strategy.allocations)).toBe(true);
    expect(strategy.allocations.length).toBeGreaterThan(0);
  });

  it("optimizes ad CPM", () => {
    const result = autonomousRevenue.optimizeAd("ad-001", 5.0, ["tech", "crypto"]);
    expect(result).toHaveProperty("adId");
    expect(result).toHaveProperty("optimizedCpm");
    expect(result).toHaveProperty("estimatedImpressions");
  });

  it("routes affiliate commission", () => {
    const route = autonomousRevenue.routeAffiliate(4001, "product-xyz", 4002);
    expect(route).toHaveProperty("userId");
    expect(route.userId).toBe(4001);
    expect(route).toHaveProperty("commissionRate");
    expect(route.commissionRate).toBeGreaterThan(0);
  });

  it("optimizes creator packages", () => {
    const result = autonomousRevenue.optimizeCreatorPackages(3001, [
      { name: "Basic", price: 5, subscribers: 100 },
      { name: "Pro", price: 15, subscribers: 30 },
    ]);
    expect(result).toHaveProperty("creatorId");
    expect(result).toHaveProperty("recommendations");
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

describe("Phase 12C: Economic Risk", () => {
  it("monitors volatility and creates an alert", () => {
    const alert = economicRisk.monitorVolatility("SKY444", 0.05, 0.10);
    expect(alert).not.toBeNull();
    expect(alert?.asset).toBe("SKY444");
    expect(alert?.severity).toBeDefined();
    expect(alert?.changePercent).toBeGreaterThan(0);
  });

  it("gets volatility alerts", () => {
    const alerts = economicRisk.getVolatilityAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it("runs a treasury stress test", () => {
    const test = economicRisk.runTreasuryStressTest("market_crash", 1000000, 0.4);
    expect(test).toHaveProperty("scenario");
    expect(test.scenario).toBe("market_crash");
    expect(test).toHaveProperty("passed");
    expect(test).toHaveProperty("finalBalance");
    expect(test).toHaveProperty("maxDrawdown");
  });

  it("gets stress tests", () => {
    const tests = economicRisk.getStressTests();
    expect(Array.isArray(tests)).toBe(true);
    expect(tests.length).toBeGreaterThan(0);
  });

  it("detects economic anomaly", () => {
    const anomaly = economicRisk.detectEconomicAnomaly("daily_transactions", 1000, 5000);
    expect(anomaly).not.toBeNull();
    expect(anomaly?.metric).toBe("daily_transactions");
    expect(anomaly?.severity).toBeDefined();
    expect(anomaly?.deviationPercent).toBeGreaterThan(0);
  });

  it("gets economic anomalies", () => {
    const anomalies = economicRisk.getEconomicAnomalies();
    expect(Array.isArray(anomalies)).toBe(true);
    expect(anomalies.length).toBeGreaterThan(0);
  });

  it("detects fraud liquidity", () => {
    const alert = economicRisk.detectFraudLiquidity("SKY444", 10000000, 100000);
    expect(alert).not.toBeNull();
    expect(alert?.asset).toBe("SKY444");
    expect(alert?.type).toBeDefined();
  });

  it("gets fraud alerts", () => {
    const alerts = economicRisk.getFraudAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it("gets economic risk dashboard", () => {
    const dashboard = economicRisk.getEconomicRiskDashboard();
    expect(dashboard).toHaveProperty("volatilityAlerts");
    expect(dashboard).toHaveProperty("stressTestsPassed");
    expect(dashboard).toHaveProperty("fraudAlerts");
    expect(dashboard).toHaveProperty("anomalies");
    expect(dashboard).toHaveProperty("overallRiskScore");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 13: AI CIVILIZATION
// ═══════════════════════════════════════════════════════════════════════════════

describe("Phase 13A: HOPE Multi-Agent Network", () => {
  it("creates an AI agent", () => {
    const agent = hopeMultiAgentNetwork.createAgent("content_moderator", "ContentGuard-1");
    expect(agent).toHaveProperty("id");
    expect(agent).toHaveProperty("type");
    expect(agent.type).toBe("content_moderator");
    expect(agent).toHaveProperty("name");
    expect(agent.name).toBe("ContentGuard-1");
    expect(agent).toHaveProperty("status");
  });

  it("gets an agent by ID", () => {
    const agent = hopeMultiAgentNetwork.createAgent("feed_ranker", "FeedAI-1");
    const fetched = hopeMultiAgentNetwork.getAgent(agent.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(agent.id);
  });

  it("gets an agent by type", () => {
    const agent = hopeMultiAgentNetwork.getAgentByType("content_moderator");
    expect(agent).not.toBeNull();
    expect(agent?.type).toBe("content_moderator");
  });

  it("gets all agents", () => {
    const agents = hopeMultiAgentNetwork.getAllAgents();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThanOrEqual(2);
  });

  it("dispatches a task to an agent", () => {
    const task = hopeMultiAgentNetwork.dispatchTask(
      "content_moderator",
      "moderate_post",
      { postId: "p-500", content: "Test content", authorId: 1 },
      "high"
    );
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("agentType");
    expect(task.agentType).toBe("content_moderator");
    expect(task).toHaveProperty("taskType");
    expect(task.taskType).toBe("moderate_post");
    expect(task).toHaveProperty("status");
  });

  it("gets a task by ID", () => {
    const task = hopeMultiAgentNetwork.dispatchTask("feed_ranker", "rank_feed", { userId: 1 });
    const fetched = hopeMultiAgentNetwork.getTask(task.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(task.id);
  });

  it("gets agent tasks", () => {
    const tasks = hopeMultiAgentNetwork.getAgentTasks("content_moderator");
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("coordinates multiple agents", () => {
    const agent1 = hopeMultiAgentNetwork.createAgent("trend_analyzer", "TrendAI-1");
    const agent2 = hopeMultiAgentNetwork.createAgent("recommendation_engine", "RecAI-1");
    const coordination = hopeMultiAgentNetwork.coordinateAgents(agent1.id, [agent2.id], "Optimize feed quality");
    expect(coordination).toHaveProperty("id");
    expect(coordination).toHaveProperty("primaryAgentId");
    expect(coordination.primaryAgentId).toBe(agent1.id);
    expect(coordination).toHaveProperty("objective");
    expect(coordination).toHaveProperty("status");
  });

  it("gets network status", () => {
    const status = hopeMultiAgentNetwork.getNetworkStatus();
    expect(status).toHaveProperty("totalAgents");
    expect(status).toHaveProperty("activeAgents");
    expect(status).toHaveProperty("totalTasksCompleted");
    expect(status).toHaveProperty("avgSuccessRate");
    expect(status).toHaveProperty("queuedTasks");
    expect(status.totalAgents).toBeGreaterThan(0);
  });
});

describe("Phase 13B: Autonomous Operations", () => {
  it("routes a support ticket", () => {
    const ticket = autonomousOperations.routeSupportTicket(
      5001, "technical", "Login issue", "I cannot log in to my account"
    );
    expect(ticket).toHaveProperty("id");
    expect(ticket).toHaveProperty("userId");
    expect(ticket.userId).toBe(5001);
    expect(ticket).toHaveProperty("category");
    expect(ticket.category).toBe("technical");
    expect(ticket).toHaveProperty("status");
    expect(ticket).toHaveProperty("assignedAgent");
  });

  it("gets a ticket by ID", () => {
    const ticket = autonomousOperations.routeSupportTicket(5002, "billing", "Charge issue", "Double charged");
    const fetched = autonomousOperations.getTicket(ticket.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(ticket.id);
  });

  it("gets user tickets", () => {
    const tickets = autonomousOperations.getUserTickets(5001);
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
  });

  it("responds to an incident", () => {
    const incident = autonomousOperations.respondToIncident(
      "database_slowdown", "high", "Database queries are running slowly", ["database", "api"]
    );
    expect(incident).toHaveProperty("id");
    expect(incident).toHaveProperty("type");
    expect(incident.type).toBe("database_slowdown");
    expect(incident).toHaveProperty("severity");
    expect(incident.severity).toBe("high");
    expect(incident).toHaveProperty("status");
    expect(incident).toHaveProperty("actions");
  });

  it("gets an incident by ID", () => {
    const incident = autonomousOperations.respondToIncident("api_timeout", "medium", "API timeouts", ["api"]);
    const fetched = autonomousOperations.getIncident(incident.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(incident.id);
  });

  it("generates a creator growth plan", () => {
    const plan = autonomousOperations.generateCreatorPlan(6001, 90);
    expect(plan).toHaveProperty("creatorId");
    expect(plan.creatorId).toBe(6001);
    expect(plan).toHaveProperty("horizon");
    expect(plan.horizon).toBe(90);
    expect(plan).toHaveProperty("goals");
    expect(plan).toHaveProperty("actions");
    expect(Array.isArray(plan.actions)).toBe(true);
  });

  it("gets a creator plan", () => {
    const plan = autonomousOperations.getCreatorPlan(6001);
    expect(plan).not.toBeNull();
    expect(plan?.creatorId).toBe(6001);
  });

  it("generates a growth plan for a segment", () => {
    const plan = autonomousOperations.generateGrowthPlan("new_creators", { followers: 500, posts: 10, engagementRate: 0.03 });
    expect(plan).toHaveProperty("segment");
    expect(plan.segment).toBe("new_creators");
    expect(plan).toHaveProperty("strategies");
    expect(Array.isArray(plan.strategies)).toBe(true);
    expect(plan.strategies.length).toBeGreaterThan(0);
  });

  it("orchestrates a live event", () => {
    const result = autonomousOperations.orchestrateEvent("event-001", "concert");
    expect(result).toHaveProperty("eventId");
    expect(result.eventId).toBe("event-001");
    expect(result).toHaveProperty("orchestrationPlan");
    expect(Array.isArray(result.orchestrationPlan)).toBe(true);
    expect(result).toHaveProperty("aiActions");
  });
});

describe("Phase 13C: Intelligence Memory", () => {
  it("gets creator memory (auto-creates)", () => {
    const memory = intelligenceMemory.getCreatorMemory(7001);
    expect(memory).toHaveProperty("creatorId");
    expect(memory.creatorId).toBe(7001);
    expect(memory).toHaveProperty("topTopics");
    expect(memory).toHaveProperty("audienceProfile");
  });

  it("records creator content and updates memory", () => {
    intelligenceMemory.recordCreatorContent(7001, "crypto", 0.85);
    const memory = intelligenceMemory.getCreatorMemory(7001);
    expect(memory.topTopics).toContain("crypto");
  });

  it("updates creator memory", () => {
    intelligenceMemory.updateCreatorMemory(7001, { bestPostingTime: "18:00" });
    const memory = intelligenceMemory.getCreatorMemory(7001);
    expect(memory.bestPostingTime).toBe("18:00");
  });

  it("gets user preference memory (auto-creates)", () => {
    const memory = intelligenceMemory.getUserPreferenceMemory(8001);
    expect(memory).toHaveProperty("userId");
    expect(memory.userId).toBe(8001);
    expect(memory).toHaveProperty("preferredTopics");
    expect(memory).toHaveProperty("preferredCreators");
  });

  it("records user interaction and updates preferences", () => {
    intelligenceMemory.recordUserInteraction(8001, "video", 7001, "crypto");
    const memory = intelligenceMemory.getUserPreferenceMemory(8001);
    expect(memory.preferredTopics).toContain("crypto");
    expect(memory.preferredCreators).toContain(7001);
  });

  it("gets trust memory (auto-creates)", () => {
    const memory = intelligenceMemory.getTrustMemory(9001);
    expect(memory).toHaveProperty("userId");
    expect(memory.userId).toBe(9001);
    expect(memory).toHaveProperty("trustScore");
    expect(memory).toHaveProperty("positiveEvents");
  });

  it("records trust event and updates score", () => {
    intelligenceMemory.recordTrustEvent(9001, "positive", "helpful_content", 10);
    const memory = intelligenceMemory.getTrustMemory(9001);
    expect(memory.trustScore).toBeGreaterThan(0);
    expect(memory.positiveEvents).toBeGreaterThan(0);
  });

  it("gets fraud memory (auto-creates)", () => {
    const memory = intelligenceMemory.getFraudMemory(9002);
    expect(memory).toHaveProperty("userId");
    expect(memory.userId).toBe(9002);
    expect(memory).toHaveProperty("riskScore");
    expect(memory).toHaveProperty("flaggedBehaviors");
  });

  it("records fraud signal and increases risk score", () => {
    intelligenceMemory.recordFraudSignal(9002, "rapid_posting", "192.168.1.1", "device-abc");
    const memory = intelligenceMemory.getFraudMemory(9002);
    expect(memory.riskScore).toBeGreaterThan(0);
    expect(memory.flaggedBehaviors.length).toBeGreaterThan(0);
  });

  it("gets economic memory for an entity", () => {
    const memory = intelligenceMemory.getEconomicMemory("creator-7001", "creator");
    expect(memory).toHaveProperty("entityId");
    expect(memory.entityId).toBe("creator-7001");
    expect(memory).toHaveProperty("entityType");
    expect(memory.entityType).toBe("creator");
    expect(memory).toHaveProperty("revenueHistory");
  });

  it("records economic event", () => {
    intelligenceMemory.recordEconomicEvent("creator-7001", "creator", "2024-01", 5000);
    const memory = intelligenceMemory.getEconomicMemory("creator-7001", "creator");
    expect(memory.revenueHistory.length).toBeGreaterThan(0);
  });

  it("gets memory stats", () => {
    const stats = intelligenceMemory.getMemoryStats();
    expect(stats).toHaveProperty("totalCreatorMemories");
    expect(stats).toHaveProperty("totalUserMemories");
    expect(stats).toHaveProperty("totalTrustMemories");
    expect(stats).toHaveProperty("totalFraudMemories");
    expect(stats).toHaveProperty("totalEconomicMemories");
    expect(stats.totalCreatorMemories).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 14: PLATFORM PERMANENCE
// ═══════════════════════════════════════════════════════════════════════════════

describe("Phase 14A: Durability Layer", () => {
  let archiveId: string;
  let vaultCreatorId: number;

  it("archives an entity", () => {
    const record = durabilityLayer.archiveEntity("post", "post-10001", { content: "Hello world", authorId: 1 });
    expect(record).toHaveProperty("id");
    expect(record).toHaveProperty("entityType");
    expect(record.entityType).toBe("post");
    expect(record).toHaveProperty("entityId");
    expect(record.entityId).toBe("post-10001");
    expect(record).toHaveProperty("checksum");
    archiveId = record.id;
  });

  it("gets an archive by ID", () => {
    const record = durabilityLayer.getArchive(archiveId);
    expect(record).not.toBeNull();
    expect(record?.id).toBe(archiveId);
  });

  it("gets all archives for an entity", () => {
    durabilityLayer.archiveEntity("post", "post-10001", { content: "Updated content", authorId: 1 });
    const archives = durabilityLayer.getEntityArchives("post", "post-10001");
    expect(Array.isArray(archives)).toBe(true);
    expect(archives.length).toBeGreaterThanOrEqual(2);
  });

  it("records an immutable event", () => {
    const event = durabilityLayer.recordImmutableEvent("post_created", "user-1", "post-10001", { content: "Hello" });
    expect(event).toHaveProperty("id");
    expect(event).toHaveProperty("eventType");
    expect(event.eventType).toBe("post_created");
    expect(event).toHaveProperty("hash");
    expect(event).toHaveProperty("immutable");
    expect(event.immutable).toBe(true);
  });

  it("gets an immutable event by ID", () => {
    const event = durabilityLayer.recordImmutableEvent("user_joined", "user-2", "platform", {});
    const fetched = durabilityLayer.getImmutableEvent(event.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(event.id);
  });

  it("gets event history for an entity", () => {
    const history = durabilityLayer.getEventHistory("post-10001");
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("creates a creator vault", () => {
    vaultCreatorId = 11001;
    const vault = durabilityLayer.createCreatorVault(vaultCreatorId);
    expect(vault).toHaveProperty("creatorId");
    expect(vault.creatorId).toBe(vaultCreatorId);
    expect(vault).toHaveProperty("status");
    expect(vault.status).toBe("active");
    expect(vault).toHaveProperty("contents");
  });

  it("gets a creator vault", () => {
    const vault = durabilityLayer.getCreatorVault(vaultCreatorId);
    expect(vault).not.toBeNull();
    expect(vault?.creatorId).toBe(vaultCreatorId);
  });

  it("seals a creator vault", () => {
    const sealed = durabilityLayer.sealCreatorVault(vaultCreatorId);
    expect(sealed.status).toBe("sealed");
    expect(sealed.sealedAt).toBeDefined();
  });

  it("archives a community", () => {
    const archive = durabilityLayer.archiveCommunity("comm-001", "CryptoTalk", 5000, 25000);
    expect(archive).toHaveProperty("communityId");
    expect(archive.communityId).toBe("comm-001");
    expect(archive).toHaveProperty("name");
    expect(archive.name).toBe("CryptoTalk");
    expect(archive).toHaveProperty("memberCount");
    expect(archive.memberCount).toBe(5000);
  });

  it("gets durability stats", () => {
    const stats = durabilityLayer.getDurabilityStats();
    expect(stats).toHaveProperty("totalArchives");
    expect(stats).toHaveProperty("totalImmutableEvents");
    expect(stats).toHaveProperty("totalVaults");
    expect(stats).toHaveProperty("totalCommunityArchives");
    expect(stats).toHaveProperty("storageUsedGB");
    expect(stats.totalArchives).toBeGreaterThan(0);
    expect(stats.totalImmutableEvents).toBeGreaterThan(0);
  });
});

describe("Phase 14B: Governance Permanence", () => {
  it("gets constitutional rules", () => {
    const rules = governancePermanence.getConstitutionalRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty("article");
    expect(rules[0]).toHaveProperty("title");
    expect(rules[0]).toHaveProperty("text");
  });

  it("proposes a constitutional amendment", () => {
    const proposal = governancePermanence.proposeConstitutionalAmendment(
      1, 3, "Free Speech Protection", "All users have the right to express opinions without censorship except for illegal content.", 1
    );
    expect(proposal).toHaveProperty("proposalId");
    expect(proposal).toHaveProperty("status");
    expect(proposal).toHaveProperty("requiredApprovals");
    expect(proposal.requiredApprovals).toBeGreaterThan(0);
  });

  it("records a governance action", () => {
    const proposal = governancePermanence.proposeConstitutionalAmendment(2, 1, "Privacy Rights", "Users own their data.", 1);
    const record = governancePermanence.recordGovernanceAction(proposal.proposalId, "vote", "user-1", { vote: "for" });
    expect(record).toHaveProperty("id");
    expect(record).toHaveProperty("proposalId");
    expect(record.proposalId).toBe(proposal.proposalId);
    expect(record).toHaveProperty("action");
    expect(record.action).toBe("vote");
    expect(record).toHaveProperty("hash");
  });

  it("gets governance history for a proposal", () => {
    const proposal = governancePermanence.proposeConstitutionalAmendment(3, 1, "Token Rights", "Token holders have voting rights.", 1);
    governancePermanence.recordGovernanceAction(proposal.proposalId, "vote", "user-2", { vote: "for" });
    governancePermanence.recordGovernanceAction(proposal.proposalId, "vote", "user-3", { vote: "against" });
    const history = governancePermanence.getGovernanceHistory(proposal.proposalId);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(2);
  });

  it("records a treasury action", () => {
    const record = governancePermanence.recordTreasuryAction("allocation", 500000, "USD", "treasury-multisig", "US");
    expect(record).toHaveProperty("id");
    expect(record).toHaveProperty("action");
    expect(record.action).toBe("allocation");
    expect(record).toHaveProperty("amount");
    expect(record.amount).toBe(500000);
    expect(record).toHaveProperty("hash");
  });

  it("gets treasury history", () => {
    const history = governancePermanence.getTreasuryHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("verifies governance integrity", () => {
    const result = governancePermanence.verifyGovernanceIntegrity();
    expect(result).toHaveProperty("valid");
    expect(result.valid).toBe(true);
    expect(result).toHaveProperty("totalRecords");
    expect(result).toHaveProperty("tamperedRecords");
    expect(result.tamperedRecords).toBe(0);
    expect(result).toHaveProperty("lastVerified");
  });
});

describe("Phase 14C: Legacy Systems", () => {
  it("creates a creator inheritance plan", () => {
    const inheritance = legacySystems.createCreatorInheritance(
      12001, 12002,
      { posts: true, revenue: true, subscribers: true, nfts: true },
      "Transfer all assets upon account inactivity for 2 years"
    );
    expect(inheritance).toHaveProperty("id");
    expect(inheritance).toHaveProperty("creatorId");
    expect(inheritance.creatorId).toBe(12001);
    expect(inheritance).toHaveProperty("beneficiaryId");
    expect(inheritance.beneficiaryId).toBe(12002);
    expect(inheritance).toHaveProperty("status");
    expect(inheritance.status).toBe("active");
  });

  it("gets a creator inheritance plan", () => {
    const inheritance = legacySystems.getCreatorInheritance(12001);
    expect(inheritance).not.toBeNull();
    expect(inheritance?.creatorId).toBe(12001);
  });

  it("triggers an inheritance", () => {
    const inheritance = legacySystems.createCreatorInheritance(
      12003, 12004,
      { posts: true, revenue: false, subscribers: true, nfts: false },
      "Transfer posts and subscribers"
    );
    const triggered = legacySystems.triggerInheritance(inheritance.id);
    expect(triggered.status).toBe("executed");
    expect(triggered.executedAt).toBeDefined();
  });

  it("creates a treasury succession plan", () => {
    const succession = legacySystems.createTreasurySuccession(
      "treasury-multisig",
      [
        { address: "0xabc123", weight: 0.5, role: "primary" },
        { address: "0xdef456", weight: 0.5, role: "backup" },
      ],
      ["founding_team_departure", "regulatory_requirement"]
    );
    expect(succession).toHaveProperty("id");
    expect(succession).toHaveProperty("currentCustodian");
    expect(succession.currentCustodian).toBe("treasury-multisig");
    expect(succession).toHaveProperty("successors");
    expect(succession.successors.length).toBe(2);
  });

  it("initiates a community ownership transfer", () => {
    const transfer = legacySystems.initiateOwnershipTransfer("comm-legacy-1", 13001, 13002, "Creator retiring");
    expect(transfer).toHaveProperty("id");
    expect(transfer).toHaveProperty("communityId");
    expect(transfer.communityId).toBe("comm-legacy-1");
    expect(transfer).toHaveProperty("fromOwnerId");
    expect(transfer.fromOwnerId).toBe(13001);
    expect(transfer).toHaveProperty("status");
    expect(transfer.status).toBe("pending");
  });

  it("votes on a community ownership transfer", () => {
    const transfer = legacySystems.initiateOwnershipTransfer("comm-legacy-2", 13003, 13004, "Handover");
    const voted = legacySystems.voteOnTransfer(transfer.id, "for");
    expect(voted).toHaveProperty("votes");
    expect(voted.votes.for).toBeGreaterThan(0);
  });

  it("executes a community ownership transfer", () => {
    const transfer = legacySystems.initiateOwnershipTransfer("comm-legacy-3", 13005, 13006, "Succession");
    legacySystems.voteOnTransfer(transfer.id, "for");
    legacySystems.voteOnTransfer(transfer.id, "for");
    legacySystems.voteOnTransfer(transfer.id, "for");
    const executed = legacySystems.executeOwnershipTransfer(transfer.id);
    expect(executed.status).toBe("completed");
    expect(executed.executedAt).toBeDefined();
  });

  it("gets institutional continuity tools", () => {
    const tools = legacySystems.getInstitutionalContinuityTools();
    expect(tools).toHaveProperty("tools");
    expect(Array.isArray(tools.tools)).toBe(true);
    expect(tools).toHaveProperty("continuityScore");
    expect(tools.continuityScore).toBeGreaterThan(0);
  });
});

describe("Phase 14D: Disaster Recovery", () => {
  it("updates replication config", () => {
    const config = disasterRecovery.updateReplicationConfig({
      primaryRegion: "us-east-1",
      replicaRegions: ["eu-west-1", "ap-southeast-1"],
      replicationFactor: 3,
      syncMode: "async",
    });
    expect(config).toHaveProperty("primaryRegion");
    expect(config.primaryRegion).toBe("us-east-1");
    expect(config).toHaveProperty("replicaRegions");
    expect(config.replicaRegions.length).toBe(2);
  });

  it("gets replication config", () => {
    const config = disasterRecovery.getReplicationConfig();
    expect(config).not.toBeNull();
    expect(config?.primaryRegion).toBe("us-east-1");
  });

  it("creates a cold storage backup", () => {
    const backup = disasterRecovery.createColdStorageBackup("full", "us-east-1");
    expect(backup).toHaveProperty("id");
    expect(backup).toHaveProperty("type");
    expect(backup.type).toBe("full");
    expect(backup).toHaveProperty("region");
    expect(backup.region).toBe("us-east-1");
    expect(backup).toHaveProperty("status");
  });

  it("gets a cold storage backup by ID", () => {
    const backup = disasterRecovery.createColdStorageBackup("incremental", "eu-west-1");
    const fetched = disasterRecovery.getColdStorageBackup(backup.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(backup.id);
  });

  it("lists cold storage backups", () => {
    const backups = disasterRecovery.listColdStorageBackups();
    expect(Array.isArray(backups)).toBe(true);
    expect(backups.length).toBeGreaterThanOrEqual(2);
  });

  it("runs a recovery drill", () => {
    const drill = disasterRecovery.runRecoveryDrill("region_failure");
    expect(drill).toHaveProperty("id");
    expect(drill).toHaveProperty("scenario");
    expect(drill.scenario).toBe("region_failure");
    expect(drill).toHaveProperty("passed");
    expect(drill).toHaveProperty("rtoAchieved");
    expect(drill).toHaveProperty("rpoAchieved");
  });

  it("gets recovery drills", () => {
    const drills = disasterRecovery.getRecoveryDrills();
    expect(Array.isArray(drills)).toBe(true);
    expect(drills.length).toBeGreaterThan(0);
  });

  it("configures failover for a service", () => {
    const config = disasterRecovery.configureFailover(
      "api-gateway",
      "https://api.primary.shadowchat.com",
      ["https://api.backup1.shadowchat.com", "https://api.backup2.shadowchat.com"]
    );
    expect(config).toHaveProperty("service");
    expect(config.service).toBe("api-gateway");
    expect(config).toHaveProperty("primaryEndpoint");
    expect(config).toHaveProperty("failoverEndpoints");
    expect(config.failoverEndpoints.length).toBe(2);
  });

  it("triggers failover for a service", () => {
    const triggered = disasterRecovery.triggerFailover("api-gateway");
    expect(triggered).toHaveProperty("service");
    expect(triggered.service).toBe("api-gateway");
    expect(triggered).toHaveProperty("isFailedOver");
    expect(triggered.isFailedOver).toBe(true);
    expect(triggered).toHaveProperty("activeEndpoint");
  });

  it("gets failover config for a service", () => {
    const config = disasterRecovery.getFailoverConfig("api-gateway");
    expect(config).not.toBeNull();
    expect(config?.service).toBe("api-gateway");
  });

  it("gets disaster recovery status", () => {
    const status = disasterRecovery.getDisasterRecoveryStatus();
    expect(status).toHaveProperty("replicationHealth");
    expect(status).toHaveProperty("coldBackups");
    expect(status).toHaveProperty("lastDrillPassed");
    expect(status).toHaveProperty("failoverReady");
    expect(status).toHaveProperty("rtoMinutes");
    expect(status).toHaveProperty("rpoMinutes");
    expect(status.coldBackups).toBeGreaterThan(0);
  });
});
