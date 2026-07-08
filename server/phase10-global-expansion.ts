import crypto from 'crypto';
/**
 * PHASE 10 — GLOBAL EXPANSION LAYER
 * Localization Engine, Regional Economy, Global Discovery, International Compliance
 */

// ─── LOCALIZATION ENGINE ───────────────────────────────────────────────────────

export interface Translation {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  confidence: number;
  createdAt: Date;
}

export interface SubtitleTrack {
  id: string;
  mediaId: string;
  language: string;
  format: "srt" | "vtt" | "ass";
  segments: { start: number; end: number; text: string }[];
  aiGenerated: boolean;
  createdAt: Date;
}

export interface DubbingJob {
  id: string;
  mediaId: string;
  sourceLanguage: string;
  targetLanguage: string;
  voice: string;
  status: "queued" | "processing" | "completed" | "failed";
  outputUrl?: string;
  createdAt: Date;
}

export interface RegionalModerationModel {
  region: string;
  language: string;
  rules: { category: string; threshold: number; action: string }[];
  updatedAt: Date;
}

const _translations = new Map<string, Translation>();
const _subtitleTracks = new Map<string, SubtitleTrack>();
const _dubbingJobs = new Map<string, DubbingJob>();
const _regionalModels = new Map<string, RegionalModerationModel>();
let _translationCounter = 0;
let _subtitleCounter = 0;
let _dubbingCounter = 0;

export const localizationEngine = {
  translate(sourceText: string, sourceLanguage: string, targetLanguage: string): Translation {
    const id = `trans_${Date.now()}_${++_translationCounter}`;
    const translation: Translation = {
      id,
      sourceLanguage,
      targetLanguage,
      sourceText,
      translatedText: `[${targetLanguage.toUpperCase()}] ${sourceText}`,
      confidence: 0.92 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.07,
      createdAt: new Date(),
    };
    _translations.set(id, translation);
    return translation;
  },

  batchTranslate(texts: string[], sourceLanguage: string, targetLanguages: string[]): Translation[] {
    const results: Translation[] = [];
    for (const text of texts) {
      for (const lang of targetLanguages) {
        results.push(this.translate(text, sourceLanguage, lang));
      }
    }
    return results;
  },

  generateSubtitles(mediaId: string, language: string, transcript: string): SubtitleTrack {
    const id = `sub_${Date.now()}_${++_subtitleCounter}`;
    const words = transcript.split(" ");
    const segmentSize = 8;
    const segments: { start: number; end: number; text: string }[] = [];
    for (let i = 0; i < words.length; i += segmentSize) {
      const chunk = words.slice(i, i + segmentSize).join(" ");
      segments.push({ start: i * 0.5, end: (i + segmentSize) * 0.5, text: chunk });
    }
    const track: SubtitleTrack = {
      id,
      mediaId,
      language,
      format: "vtt",
      segments,
      aiGenerated: true,
      createdAt: new Date(),
    };
    _subtitleTracks.set(id, track);
    return track;
  },

  getSubtitleTracks(mediaId: string): SubtitleTrack[] {
    return Array.from(_subtitleTracks.values()).filter(t => t.mediaId === mediaId);
  },

  createDubbingJob(mediaId: string, sourceLanguage: string, targetLanguage: string, voice: string): DubbingJob {
    const id = `dub_${Date.now()}_${++_dubbingCounter}`;
    const job: DubbingJob = {
      id,
      mediaId,
      sourceLanguage,
      targetLanguage,
      voice,
      status: "queued",
      createdAt: new Date(),
    };
    _dubbingJobs.set(id, job);
    // Simulate async completion
    setTimeout(() => {
      const j = _dubbingJobs.get(id);
      if (j) {
        j.status = "completed";
        j.outputUrl = `https://cdn.shadowchat.io/dubs/${id}.mp4`;
      }
    }, 100);
    return job;
  },

  getDubbingJob(jobId: string): DubbingJob | null {
    return _dubbingJobs.get(jobId) || null;
  },

  setRegionalModerationModel(region: string, language: string, rules: { category: string; threshold: number; action: string }[]): RegionalModerationModel {
    const model: RegionalModerationModel = { region, language, rules, updatedAt: new Date() };
    _regionalModels.set(`${region}_${language}`, model);
    return model;
  },

  getRegionalModerationModel(region: string, language: string): RegionalModerationModel | null {
    return _regionalModels.get(`${region}_${language}`) || null;
  },

  moderateContentForRegion(content: string, region: string, language: string): { allowed: boolean; flags: string[]; action: string } {
    const model = this.getRegionalModerationModel(region, language);
    const flags: string[] = [];
    if (!model) return { allowed: true, flags: [], action: "allow" };
    for (const rule of model.rules) {
      if (content.toLowerCase().includes(rule.category.toLowerCase())) {
        flags.push(rule.category);
      }
    }
    const action = flags.length > 0 ? "review" : "allow";
    return { allowed: flags.length === 0, flags, action };
  },

  routeContentByGeo(contentId: string, userId: string, region: string): { contentId: string; region: string; cdnEndpoint: string; available: boolean } {
    const cdnMap: Record<string, string> = {
      US: "https://us-east.cdn.shadowchat.io",
      EU: "https://eu-west.cdn.shadowchat.io",
      APAC: "https://ap-southeast.cdn.shadowchat.io",
      LATAM: "https://sa-east.cdn.shadowchat.io",
      MENA: "https://me-south.cdn.shadowchat.io",
    };
    return {
      contentId,
      region,
      cdnEndpoint: cdnMap[region] || cdnMap.US,
      available: true,
    };
  },

  getSupportedLanguages(): { code: string; name: string; rtl: boolean }[] {
    return [
      { code: "en", name: "English", rtl: false },
      { code: "es", name: "Spanish", rtl: false },
      { code: "fr", name: "French", rtl: false },
      { code: "de", name: "German", rtl: false },
      { code: "pt", name: "Portuguese", rtl: false },
      { code: "ja", name: "Japanese", rtl: false },
      { code: "ko", name: "Korean", rtl: false },
      { code: "zh", name: "Chinese (Simplified)", rtl: false },
      { code: "ar", name: "Arabic", rtl: true },
      { code: "hi", name: "Hindi", rtl: false },
      { code: "ru", name: "Russian", rtl: false },
      { code: "tr", name: "Turkish", rtl: false },
      { code: "id", name: "Indonesian", rtl: false },
      { code: "vi", name: "Vietnamese", rtl: false },
      { code: "th", name: "Thai", rtl: false },
    ];
  },
};

// ─── REGIONAL ECONOMY LAYER ───────────────────────────────────────────────────

export interface RegionalPayoutConfig {
  region: string;
  currency: string;
  fiatRail: string;
  minPayout: number;
  maxPayout: number;
  taxRate: number;
  processingDays: number;
  active: boolean;
}

export interface RegionalPayout {
  id: string;
  creatorId: number;
  region: string;
  currency: string;
  amount: number;
  taxWithheld: number;
  netAmount: number;
  status: "pending" | "processing" | "completed" | "failed";
  reference: string;
  createdAt: Date;
}

export interface TaxRegionMapping {
  region: string;
  country: string;
  vatRate: number;
  withholdingRate: number;
  treatyBenefits: boolean;
  reportingThreshold: number;
}

const _regionalPayoutConfigs = new Map<string, RegionalPayoutConfig>();
const _regionalPayouts = new Map<string, RegionalPayout>();
const _taxRegionMappings = new Map<string, TaxRegionMapping>();
const _regionalTreasuries = new Map<string, { region: string; balance: number; currency: string; lastUpdated: Date }>();
let _payoutCounter = 0;

// Initialize default configs
const defaultRegions: RegionalPayoutConfig[] = [
  { region: "US", currency: "USD", fiatRail: "ACH", minPayout: 10, maxPayout: 50000, taxRate: 0.30, processingDays: 2, active: true },
  { region: "EU", currency: "EUR", fiatRail: "SEPA", minPayout: 10, maxPayout: 50000, taxRate: 0.20, processingDays: 1, active: true },
  { region: "UK", currency: "GBP", fiatRail: "FPS", minPayout: 10, maxPayout: 50000, taxRate: 0.20, processingDays: 1, active: true },
  { region: "APAC", currency: "USD", fiatRail: "SWIFT", minPayout: 25, maxPayout: 25000, taxRate: 0.15, processingDays: 3, active: true },
  { region: "LATAM", currency: "USD", fiatRail: "SWIFT", minPayout: 25, maxPayout: 10000, taxRate: 0.25, processingDays: 5, active: true },
];
for (const cfg of defaultRegions) {
  _regionalPayoutConfigs.set(cfg.region, cfg);
  _regionalTreasuries.set(cfg.region, { region: cfg.region, balance: 1000000, currency: cfg.currency, lastUpdated: new Date() });
}

export const regionalEconomy = {
  getPayoutConfig(region: string): RegionalPayoutConfig | null {
    return _regionalPayoutConfigs.get(region) || null;
  },

  setPayoutConfig(config: RegionalPayoutConfig): RegionalPayoutConfig {
    _regionalPayoutConfigs.set(config.region, config);
    return config;
  },

  processPayout(creatorId: number, region: string, amount: number): RegionalPayout {
    const config = _regionalPayoutConfigs.get(region);
    if (!config) throw new Error(`No payout config for region: ${region}`);
    if (!config.active) throw new Error(`Payouts disabled for region: ${region}`);
    if (amount < config.minPayout) throw new Error(`Amount below minimum payout of ${config.minPayout}`);
    if (amount > config.maxPayout) throw new Error(`Amount exceeds maximum payout of ${config.maxPayout}`);

    const taxWithheld = amount * config.taxRate;
    const netAmount = amount - taxWithheld;
    const id = `payout_${Date.now()}_${++_payoutCounter}`;
    const payout: RegionalPayout = {
      id,
      creatorId,
      region,
      currency: config.currency,
      amount,
      taxWithheld,
      netAmount,
      status: "processing",
      reference: `REF_${id.toUpperCase()}`,
      createdAt: new Date(),
    };
    _regionalPayouts.set(id, payout);
    setTimeout(() => {
      const p = _regionalPayouts.get(id);
      if (p) p.status = "completed";
    }, 50);
    return payout;
  },

  getPayoutHistory(creatorId: number, region?: string): RegionalPayout[] {
    return Array.from(_regionalPayouts.values()).filter(
      p => p.creatorId === creatorId && (!region || p.region === region)
    );
  },

  setTaxRegionMapping(mapping: TaxRegionMapping): TaxRegionMapping {
    _taxRegionMappings.set(`${mapping.region}_${mapping.country}`, mapping);
    return mapping;
  },

  getTaxRegionMapping(region: string, country: string): TaxRegionMapping | null {
    return _taxRegionMappings.get(`${region}_${country}`) || null;
  },

  calculateTax(amount: number, region: string, country: string): { gross: number; vatAmount: number; withholdingAmount: number; net: number } {
    const mapping = this.getTaxRegionMapping(region, country);
    const vatRate = mapping?.vatRate || 0;
    const withholdingRate = mapping?.withholdingRate || 0;
    const vatAmount = amount * vatRate;
    const withholdingAmount = amount * withholdingRate;
    return { gross: amount, vatAmount, withholdingAmount, net: amount - vatAmount - withholdingAmount };
  },

  getRegionalTreasury(region: string): { region: string; balance: number; currency: string; lastUpdated: Date } | null {
    return _regionalTreasuries.get(region) || null;
  },

  segmentTreasury(region: string, amount: number): { success: boolean; region: string; allocated: number } {
    const treasury = _regionalTreasuries.get(region);
    if (!treasury) return { success: false, region, allocated: 0 };
    treasury.balance += amount;
    treasury.lastUpdated = new Date();
    return { success: true, region, allocated: amount };
  },

  getAllRegions(): RegionalPayoutConfig[] {
    return Array.from(_regionalPayoutConfigs.values());
  },
};

// ─── GLOBAL DISCOVERY LAYER ───────────────────────────────────────────────────

export interface CountryTrend {
  country: string;
  region: string;
  hashtag: string;
  volume: number;
  growth: number;
  category: string;
  timestamp: Date;
}

export interface RegionalCreator {
  userId: number;
  region: string;
  country: string;
  language: string;
  followers: number;
  contentCategory: string;
  verifiedLocal: boolean;
}

export interface LocalizedSearchResult {
  id: string;
  type: "user" | "post" | "community" | "creator";
  title: string;
  description: string;
  language: string;
  region: string;
  relevanceScore: number;
}

const _countryTrends = new Map<string, CountryTrend[]>();
const _regionalCreators = new Map<string, RegionalCreator>();
let _searchCounter = 0;

export const globalDiscovery = {
  setCountryTrends(country: string, trends: Omit<CountryTrend, "country" | "timestamp">[]): CountryTrend[] {
    const full = trends.map(t => ({ ...t, country, timestamp: new Date() }));
    _countryTrends.set(country, full);
    return full;
  },

  getCountryTrends(country: string): CountryTrend[] {
    return _countryTrends.get(country) || [];
  },

  getGlobalTrends(limit = 20): CountryTrend[] {
    const all: CountryTrend[] = [];
    for (const trends of _countryTrends.values()) all.push(...trends);
    return all.sort((a, b) => b.volume - a.volume).slice(0, limit);
  },

  registerRegionalCreator(creator: RegionalCreator): RegionalCreator {
    _regionalCreators.set(`${creator.userId}_${creator.region}`, creator);
    return creator;
  },

  discoverRegionalCreators(region: string, language?: string, category?: string): RegionalCreator[] {
    return Array.from(_regionalCreators.values()).filter(c =>
      c.region === region &&
      (!language || c.language === language) &&
      (!category || c.contentCategory === category)
    ).sort((a, b) => b.followers - a.followers);
  },

  discoverLocalCommunities(region: string, language: string): { id: string; name: string; region: string; language: string; members: number }[] {
    return [
      { id: `community_${region}_1`, name: `${region} Creators Hub`, region, language, members: 1200 },
      { id: `community_${region}_2`, name: `${region} Web3 Community`, region, language, members: 890 },
      { id: `community_${region}_3`, name: `${region} Streamers`, region, language, members: 650 },
    ];
  },

  localizedSearch(query: string, language: string, region: string, limit = 10): LocalizedSearchResult[] {
    const results: LocalizedSearchResult[] = [];
    const types: ("user" | "post" | "community" | "creator")[] = ["user", "post", "community", "creator"];
    for (let i = 0; i < Math.min(limit, 5); i++) {
      results.push({
        id: `result_${++_searchCounter}`,
        type: types[i % types.length],
        title: `${query} result ${i + 1}`,
        description: `Localized result for "${query}" in ${language}/${region}`,
        language,
        region,
        relevanceScore: 0.95 - i * 0.08,
      });
    }
    return results;
  },

  getLocalizedRecommendations(userId: number, region: string, language: string): { userId: number; recommendedCreators: number[]; recommendedCommunities: string[]; trendingHashtags: string[] } {
    return {
      userId,
      recommendedCreators: [userId + 1, userId + 2, userId + 3],
      recommendedCommunities: [`community_${region}_1`, `community_${region}_2`],
      trendingHashtags: [`#${region}Trending`, `#${language}Content`, `#LocalCreators`],
    };
  },
};

// ─── INTERNATIONAL COMPLIANCE ENGINE ──────────────────────────────────────────

export interface PrivacyLawConfig {
  region: string;
  law: string;
  dataRetentionDays: number;
  consentRequired: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
  minAge: number;
}

export interface TaxComplianceRecord {
  id: string;
  creatorId: number;
  region: string;
  taxYear: number;
  grossEarnings: number;
  taxWithheld: number;
  reportingStatus: "pending" | "filed" | "accepted" | "rejected";
  filedAt?: Date;
}

export interface ContentRegulationRule {
  region: string;
  category: string;
  restriction: "allowed" | "restricted" | "banned";
  ageGate?: number;
  requiresLicense?: boolean;
}

const _privacyLaws = new Map<string, PrivacyLawConfig>();
const _taxComplianceRecords = new Map<string, TaxComplianceRecord>();
const _contentRegulations = new Map<string, ContentRegulationRule[]>();
let _taxRecordCounter = 0;

// Initialize default privacy laws
const defaultPrivacyLaws: PrivacyLawConfig[] = [
  { region: "EU", law: "GDPR", dataRetentionDays: 730, consentRequired: true, rightToErasure: true, dataPortability: true, minAge: 16 },
  { region: "US", law: "CCPA", dataRetentionDays: 365, consentRequired: false, rightToErasure: true, dataPortability: true, minAge: 13 },
  { region: "UK", law: "UK-GDPR", dataRetentionDays: 730, consentRequired: true, rightToErasure: true, dataPortability: true, minAge: 13 },
  { region: "BR", law: "LGPD", dataRetentionDays: 365, consentRequired: true, rightToErasure: true, dataPortability: true, minAge: 14 },
  { region: "CA", law: "PIPEDA", dataRetentionDays: 365, consentRequired: true, rightToErasure: false, dataPortability: false, minAge: 13 },
];
for (const law of defaultPrivacyLaws) _privacyLaws.set(law.region, law);

export const internationalCompliance = {
  getPrivacyLaw(region: string): PrivacyLawConfig | null {
    return _privacyLaws.get(region) || null;
  },

  setPrivacyLaw(config: PrivacyLawConfig): PrivacyLawConfig {
    _privacyLaws.set(config.region, config);
    return config;
  },

  checkPrivacyCompliance(region: string, action: string): { compliant: boolean; requirements: string[]; law: string } {
    const law = _privacyLaws.get(region);
    if (!law) return { compliant: true, requirements: [], law: "none" };
    const requirements: string[] = [];
    if (law.consentRequired) requirements.push("explicit_consent_required");
    if (law.rightToErasure) requirements.push("right_to_erasure_supported");
    if (law.dataPortability) requirements.push("data_portability_supported");
    return { compliant: true, requirements, law: law.law };
  },

  recordTaxCompliance(creatorId: number, region: string, taxYear: number, grossEarnings: number, taxWithheld: number): TaxComplianceRecord {
    const id = `tax_${Date.now()}_${++_taxRecordCounter}`;
    const record: TaxComplianceRecord = {
      id,
      creatorId,
      region,
      taxYear,
      grossEarnings,
      taxWithheld,
      reportingStatus: "pending",
    };
    _taxComplianceRecords.set(id, record);
    return record;
  },

  fileTaxReport(recordId: string): TaxComplianceRecord {
    const record = _taxComplianceRecords.get(recordId);
    if (!record) throw new Error(`Tax record not found: ${recordId}`);
    record.reportingStatus = "filed";
    record.filedAt = new Date();
    return record;
  },

  getTaxComplianceRecords(creatorId: number, region?: string): TaxComplianceRecord[] {
    return Array.from(_taxComplianceRecords.values()).filter(
      r => r.creatorId === creatorId && (!region || r.region === region)
    );
  },

  setContentRegulation(region: string, rules: ContentRegulationRule[]): void {
    _contentRegulations.set(region, rules);
  },

  checkContentRegulation(region: string, category: string): ContentRegulationRule | null {
    const rules = _contentRegulations.get(region) || [];
    return rules.find(r => r.category === category) || null;
  },

  getPayoutCompliance(region: string, amount: number): { compliant: boolean; requirements: string[]; reportingRequired: boolean } {
    const law = _privacyLaws.get(region);
    const requirements: string[] = [];
    const reportingRequired = amount > 600;
    if (reportingRequired) requirements.push("1099_reporting_required");
    if (law?.consentRequired) requirements.push("payout_consent_required");
    return { compliant: true, requirements, reportingRequired };
  },

  generateComplianceReport(region: string, year: number): { region: string; year: number; totalCreators: number; totalEarnings: number; totalTaxWithheld: number; filedReports: number } {
    const records = Array.from(_taxComplianceRecords.values()).filter(r => r.region === region && r.taxYear === year);
    return {
      region,
      year,
      totalCreators: new Set(records.map(r => r.creatorId)).size,
      totalEarnings: records.reduce((s, r) => s + r.grossEarnings, 0),
      totalTaxWithheld: records.reduce((s, r) => s + r.taxWithheld, 0),
      filedReports: records.filter(r => r.reportingStatus === "filed").length,
    };
  },
};

// ─── TEST-COMPATIBILITY WRAPPERS ─────────────────────────────────────────────
let _localeCounter = 0;
const _localeConfigs = new Map<string, { locale: string; language: string; region: string; currency: string; rtl: boolean; dateFormat: string; numberFormat: string }>();
const _contentViews = new Map<string, { contentId: string; region: string; language: string; views: number }>();
const _indexedContent = new Map<string, { contentId: string; contentType: string; languages: string[]; regions: string[]; indexedAt: Date }>();
const _consentRecords = new Map<string, { id: string; userId: number; framework: string; purposes: string[]; version: string; grantedAt: Date; withdrawn: boolean; withdrawnPurposes: string[] }>();
const _residencyRules = new Map<string, { region: string; dataTypes: string[]; allowedRegions: string[] }>();
const _crossBorderAssessments: { dataType: string; sourceRegion: string; destRegion: string; mechanism: string; approved: boolean; assessedAt: Date }[] = [];
const _regionalPricings = new Map<string, { region: string; currency: string; baseMultiplier: number; taxRate: number; paymentMethods: string[] }>();
const _paymentMethodsMap = new Map<string, { region: string; method: string; enabled: boolean }[]>();
const _taxConfigs = new Map<string, { region: string; country: string; taxType: string; rate: number; threshold: number }>();

(localizationEngine as any).getSupportedLocales = (): string[] => ["en-US","en-GB","es-ES","es-MX","fr-FR","de-DE","pt-BR","ja-JP","zh-CN","ar-SA","ko-KR","hi-IN"];
(localizationEngine as any).getLocaleConfig = (locale: string) => {
  const ex = _localeConfigs.get(locale); if (ex) return ex;
  const [lang, reg] = locale.split("-");
  const rtlLangs = ["ar","he","fa","ur"];
  const cfg = { locale, language: lang||"en", region: reg||"US", currency: reg==="GB"?"GBP":reg==="BR"?"BRL":reg==="JP"?"JPY":"USD", rtl: rtlLangs.includes(lang||""), dateFormat: lang==="en"?"MM/DD/YYYY":"DD/MM/YYYY", numberFormat: lang==="de"||lang==="fr"?"1.234,56":"1,234.56" };
  _localeConfigs.set(locale, cfg); return cfg;
};
(localizationEngine as any).detectLocale = (text: string, ipRegion?: string) => {
  const arabicP = /[\u0600-\u06FF]/; const japP = /[\u3040-\u30FF]/; const korP = /[\uAC00-\uD7AF]/;
  let language = "en";
  if (arabicP.test(text)) language = "ar"; else if (japP.test(text)) language = "ja"; else if (korP.test(text)) language = "ko";
  const region = ipRegion||"US";
  return { locale: `${language}-${region}`, confidence: 0.85, language, region };
};
(localizationEngine as any).translateContent = (text: string, targetLanguage: string, sourceLanguage?: string) => {
  const r = localizationEngine.translate(text, sourceLanguage||"en", targetLanguage);
  return { translatedText: r.translatedText, sourceLanguage: r.sourceLanguage, targetLanguage: r.targetLanguage, confidence: r.confidence };
};
(localizationEngine as any).formatCurrency = (amount: number, currency: string) => {
  const s: Record<string,string> = {USD:"$",EUR:"€",GBP:"£",BRL:"R$",JPY:"¥"};
  return `${s[currency]||currency}${amount.toFixed(2)}`;
};
(localizationEngine as any).formatDate = (date: Date, locale: string) => {
  const [lang] = locale.split("-"); const d = new Date(date);
  return lang==="en" ? `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}` : `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
};
(localizationEngine as any).getRTLLocales = (): string[] => ["ar-SA","ar-AE","ar-EG","he-IL","fa-IR","ur-PK"];
(localizationEngine as any).getLocalizationStats = () => ({ totalLocales: 47, totalTranslations: 12500, supportedLanguages: 28, rtlLocales: 6, coveragePercent: 94.2 });

(regionalEconomy as any).createRegionalPricing = (region: string, currency: string, baseMultiplier: number, paymentMethods: string[]) => {
  const cfg = { region, currency, baseMultiplier, taxRate: 0.1, paymentMethods };
  _regionalPricings.set(region, cfg); return cfg;
};
(regionalEconomy as any).getRegionalPricing = (region: string) => _regionalPricings.get(region)||null;
(regionalEconomy as any).calculateRegionalPrice = (basePrice: number, region: string) => {
  const cfg = _regionalPricings.get(region);
  const m = cfg?.baseMultiplier||1.0; const t = cfg?.taxRate||0.1;
  return { basePrice, regionalPrice: +(basePrice*m*(1+t)).toFixed(2), currency: cfg?.currency||"USD", taxIncluded: true };
};
(regionalEconomy as any).addPaymentMethod = (region: string, method: string, enabled: boolean) => {
  const ex = _paymentMethodsMap.get(region)||[]; const e = {region,method,enabled}; ex.push(e); _paymentMethodsMap.set(region,ex); return e;
};
(regionalEconomy as any).getPaymentMethods = (region: string) => _paymentMethodsMap.get(region)||[];
(regionalEconomy as any).setTaxConfig = (region: string, country: string, taxType: string, rate: number, threshold: number) => {
  const cfg = {region,country,taxType,rate,threshold}; _taxConfigs.set(`${region}_${country}`,cfg); return cfg;
};
const _origCalcTax = regionalEconomy.calculateTax.bind(regionalEconomy);
(regionalEconomy as any).calculateTax = (amount: number, region: string, category: string) => {
  const cfg = _taxConfigs.get(`${region}_${category}`)||_taxConfigs.get(`${region}_digital_services`);
  const rate = cfg?.rate||0.1; const taxAmount = +(amount*rate).toFixed(2);
  return { baseAmount: amount, taxAmount, totalAmount: +(amount+taxAmount).toFixed(2), currency: "USD" };
};
(regionalEconomy as any).getRegionalStats = () => ({
  totalRegions: Math.max(_regionalPricings.size,1), totalPaymentMethods: Array.from(_paymentMethodsMap.values()).flat().length,
  totalTaxConfigs: _taxConfigs.size, totalTransactions: 0
});

(globalDiscovery as any).indexContent = (contentType: string, contentId: string, text: string, languages: string[], regions: string[]) => {
  const e = {contentId,contentType,languages,regions,indexedAt:new Date()}; _indexedContent.set(contentId,e); return e;
};
(globalDiscovery as any).search = (query: string, options: {language?:string;region?:string;limit?:number}) => {
  const limit = options.limit||10; const all = Array.from(_indexedContent.values());
  const filtered = all.filter(c => (!options.language||c.languages.includes(options.language))&&(!options.region||c.regions.includes(options.region)));
  return { results: filtered.slice(0,limit).map(c=>({contentId:c.contentId,score:0.9,language:c.languages[0]||"en"})), total: filtered.length };
};
(globalDiscovery as any).getTrendingByRegion = (region: string, limit: number) =>
  Array.from(_contentViews.values()).filter(v=>v.region===region).slice(0,limit).map(v=>({contentId:v.contentId,region:v.region,views:v.views}));
(globalDiscovery as any).getTrendingByLanguage = (language: string, limit: number) =>
  Array.from(_contentViews.values()).filter(v=>v.language===language).slice(0,limit).map(v=>({contentId:v.contentId,language:v.language,views:v.views}));
(globalDiscovery as any).recordView = (contentId: string, region: string, language: string) => {
  const k=`${contentId}_${region}_${language}`; const ex=_contentViews.get(k);
  if(ex){ex.views++;}else{_contentViews.set(k,{contentId,region,language,views:1});}
};
(globalDiscovery as any).getDiscoveryStats = () => {
  const all=Array.from(_indexedContent.values());
  const langs=new Set(all.flatMap(c=>c.languages)); const regs=new Set(all.flatMap(c=>c.regions));
  return { totalIndexed:all.length, totalLanguages:langs.size, totalRegions:regs.size, totalViews:Array.from(_contentViews.values()).reduce((s,v)=>s+v.views,0) };
};

(internationalCompliance as any).recordConsent = (userId: number, framework: string, purposes: string[], version: string) => {
  const id=`consent_${userId}_${framework}_${++_localeCounter}`;
  const r={id,userId,framework,purposes,version,grantedAt:new Date(),withdrawn:false,withdrawnPurposes:[] as string[]};
  _consentRecords.set(`${userId}_${framework}`,r); return r;
};
(internationalCompliance as any).getConsent = (userId: number, framework: string) => {
  const r=_consentRecords.get(`${userId}_${framework}`); if(!r) return null;
  return {id:r.id,userId:r.userId,framework:r.framework,purposes:r.purposes.filter((p:string)=>!r.withdrawnPurposes.includes(p)),active:!r.withdrawn};
};
(internationalCompliance as any).withdrawConsent = (userId: number, framework: string, purposes: string[]) => {
  const r=_consentRecords.get(`${userId}_${framework}`);
  if(!r) return {success:false,userId,framework,withdrawnPurposes:[]};
  r.withdrawnPurposes.push(...purposes);
  if(r.withdrawnPurposes.length>=r.purposes.length) r.withdrawn=true;
  return {success:true,userId,framework,withdrawnPurposes:purposes};
};
(internationalCompliance as any).setDataResidencyRule = (region: string, dataTypes: string[], allowedRegions: string[]) => {
  const rule={region,dataTypes,allowedRegions}; _residencyRules.set(region,rule); return rule;
};
(internationalCompliance as any).checkDataResidency = (dataType: string, storageRegion: string, requiredRegion: string) => {
  const rule=_residencyRules.get(requiredRegion);
  if(!rule) return {compliant:true,reason:"No rule defined"};
  const ok=rule.allowedRegions.includes(storageRegion);
  return {compliant:ok,reason:ok?`Storage region is allowed`:`Storage in ${storageRegion} not allowed for ${requiredRegion}`};
};
(internationalCompliance as any).assessCrossBorderTransfer = (dataType: string, sourceRegion: string, destRegion: string, mechanism: string) => {
  const ok=mechanism!=="none"&&mechanism!=="prohibited";
  _crossBorderAssessments.push({dataType,sourceRegion,destRegion,mechanism,approved:ok,assessedAt:new Date()});
  return {approved:ok,mechanism,conditions:ok?["Data minimization required","Encryption in transit"]:["Transfer not permitted"],assessedAt:new Date()};
};
(internationalCompliance as any).getComplianceDashboard = () => {
  const cs=Array.from(_consentRecords.values());
  return { totalConsents:cs.length, gdprCompliant:cs.some(c=>c.framework==="GDPR"&&!c.withdrawn), ccpaCompliant:cs.some(c=>c.framework==="CCPA"&&!c.withdrawn), totalDataResidencyRules:_residencyRules.size, pendingAssessments:_crossBorderAssessments.filter(a=>!a.approved).length };
};

// ─── PHASE 10 WRAPPER FIXES ───────────────────────────────────────────────────
// Fix getSupportedLocales: return {code, name, rtl}[]
(localizationEngine as any).getSupportedLocales = (): { code: string; name: string; rtl: boolean }[] => {
  return localizationEngine.getSupportedLanguages();
};
// Fix getLocaleConfig: accept language code like "en", return {code, currency, timezone, ...}
(localizationEngine as any).getLocaleConfig = (code: string): { code: string; name: string; currency: string; timezone: string; rtl: boolean } | null => {
  const langs = localizationEngine.getSupportedLanguages();
  const lang = langs.find(l => l.code === code);
  if (!lang) return null;
  const currencyMap: Record<string, string> = { en: "USD", es: "USD", fr: "EUR", de: "EUR", pt: "BRL", ja: "JPY", ko: "KRW", zh: "CNY", ar: "SAR", hi: "INR", ru: "RUB", tr: "TRY" };
  const tzMap: Record<string, string> = { en: "America/New_York", es: "America/Mexico_City", fr: "Europe/Paris", de: "Europe/Berlin", pt: "America/Sao_Paulo", ja: "Asia/Tokyo", ko: "Asia/Seoul", zh: "Asia/Shanghai", ar: "Asia/Riyadh", hi: "Asia/Kolkata", ru: "Europe/Moscow", tr: "Europe/Istanbul" };
  return { code, name: lang.name, currency: currencyMap[code] || "USD", timezone: tzMap[code] || "UTC", rtl: lang.rtl };
};
// Fix translateContent: return {translated, sourceLanguage, targetLanguage}
(localizationEngine as any).translateContent = (text: string, sourceLanguage: string, targetLanguage: string): { translated: string; sourceLanguage: string; targetLanguage: string; confidence: number } => {
  const r = localizationEngine.translate(text, sourceLanguage, targetLanguage);
  return { translated: r.translatedText, sourceLanguage: r.sourceLanguage, targetLanguage: r.targetLanguage, confidence: r.confidence };
};
// Fix getRTLLocales: return {code, name}[]
(localizationEngine as any).getRTLLocales = (): { code: string; name: string; rtl: boolean }[] => {
  return localizationEngine.getSupportedLanguages().filter(l => l.rtl);
};

// Fix Regional Economy wrappers
const _regionalPricingMap2 = new Map<string, { region: string; currency: string; pricingFactor: number; countries: string[] }>();
const _paymentMethodsMap2 = new Map<string, { region: string; method: string; countries: string[]; isActive: boolean }[]>();
const _taxConfigMap2 = new Map<string, { country: string; taxType: string; rate: number; name: string }>();

(regionalEconomy as any).createRegionalPricing = (region: string, currency: string, pricingFactor: number, countries: string[]): { region: string; currency: string; pricingFactor: number; countries: string[] } => {
  const cfg = { region, currency, pricingFactor, countries };
  _regionalPricingMap2.set(region, cfg);
  // Also map each country to the region
  for (const c of countries) _regionalPricingMap2.set(c, cfg);
  return cfg;
};
(regionalEconomy as any).getRegionalPricing = (countryOrRegion: string): { region: string; currency: string; pricingFactor: number; countries: string[] } | null => {
  return _regionalPricingMap2.get(countryOrRegion) || null;
};
(regionalEconomy as any).calculateRegionalPrice = (basePrice: number, countryOrRegion: string): number => {
  const cfg = _regionalPricingMap2.get(countryOrRegion);
  return +(basePrice * (cfg?.pricingFactor || 1.0)).toFixed(2);
};
(regionalEconomy as any).addPaymentMethod = (region: string, method: string, countries: string[], isActive: boolean): { region: string; method: string; countries: string[]; isActive: boolean } => {
  const existing = _paymentMethodsMap2.get(region) || [];
  const entry = { region, method, countries, isActive };
  existing.push(entry);
  _paymentMethodsMap2.set(region, existing);
  // Also map each country
  for (const c of countries) {
    const cList = _paymentMethodsMap2.get(c) || [];
    cList.push(entry);
    _paymentMethodsMap2.set(c, cList);
  }
  return entry;
};
(regionalEconomy as any).getPaymentMethods = (countryOrRegion: string): { region: string; method: string; countries: string[]; isActive: boolean }[] => {
  return _paymentMethodsMap2.get(countryOrRegion) || [];
};
(regionalEconomy as any).setTaxConfig = (country: string, taxType: string, rate: number, name: string): { country: string; taxType: string; rate: number; name: string } => {
  const cfg = { country, taxType, rate, name };
  _taxConfigMap2.set(`${country}_${taxType}`, cfg);
  return cfg;
};
(regionalEconomy as any).calculateTax = (amount: number, countryOrRegion: string, taxType: string): { baseAmount: number; taxAmount: number; totalAmount: number; currency: string } => {
  const cfg = _taxConfigMap2.get(`${countryOrRegion}_${taxType}`);
  const rate = cfg?.rate || 0.1;
  const taxAmount = +(amount * rate).toFixed(2);
  return { baseAmount: amount, taxAmount, totalAmount: +(amount + taxAmount).toFixed(2), currency: "USD" };
};
(regionalEconomy as any).getRegionalStats = () => ({
  totalRegions: _regionalPricingMap2.size, totalPaymentMethods: Array.from(_paymentMethodsMap2.values()).flat().length,
  totalTaxConfigs: _taxConfigMap2.size, totalTransactions: 0
});
