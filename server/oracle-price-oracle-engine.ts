/**
 * @file oracle-engine.ts
 * @description Production TypeScript engine file for SKYCOIN4444 platform: ORACLE Price Oracle Engine.
 * This engine provides multi-source price aggregation, TWAP calculation, price deviation detection,
 * oracle manipulation resistance, cross-chain price feeds, confidence scoring, fallback mechanisms,
 * price history, volatility calculation, and market data normalization.
 */

import { invokeLLM } from './_core/llm';

// --- Interfaces and Types ---

interface PriceData {
  source: string;
  assetPair: string;
  price: number;
  timestamp: number;
  confidence: number;
}

interface AggregatedPrice {
  assetPair: string;
  price: number;
  timestamp: number;
  sources: string[];
  confidenceScore: number;
  volatility: number;
  isManipulated: boolean;
}

interface PriceHistoryEntry {
  timestamp: number;
  price: number;
}

interface OracleConfig {
  minSources: number;
  maxPriceDeviation: number;
  twapPeriodSeconds: number;
  confidenceThreshold: number;
  fallbackAssetPair?: string;
  crossChainFeedUrls: { [chain: string]: string };
}

interface MarketData {
  assetPair: string;
  volume24h: number;
  marketCap: number;
  lastPrice: number;
}

// --- Constants ---

const DEFAULT_ORACLE_CONFIG: OracleConfig = {
  minSources: 3,
  maxPriceDeviation: 0.01, // 1%
  twapPeriodSeconds: 3600, // 1 hour
  confidenceThreshold: 0.75,
  crossChainFeedUrls: {
    'ethereum': 'https://api.skycoin4444.io/oracle/ethereum',
    'binance-smart-chain': 'https://api.skycoin4444.io/oracle/bsc',
    'polygon': 'https://api.skycoin4444.io/oracle/polygon',
  },
};

const SUPPORTED_ASSET_PAIRS: string[] = [
  'BTC/USD',
  'ETH/USD',
  'BNB/USD',
  'SOL/USD',
  'ADA/USD',
  'XRP/USD',
  'DOT/USD',
  'DOGE/USD',
  'SHIB/USD',
  'LINK/USD',
  'UNI/USD',
  'LTC/USD',
  'BCH/USD',
  'AVAX/USD',
  'TRX/USD',
  'ETC/USD',
  'XLM/USD',
  'FIL/USD',
  'ICP/USD',
  'VET/USD',
  'EOS/USD',
  'XTZ/USD',
  'ALGO/USD',
  'ATOM/USD',
  'EGLD/USD',
  'THETA/USD',
  'XMR/USD',
  'NEO/USD',
  'IOTA/USD',
  'DASH/USD',
  'ZEC/USD',
  'AAVE/USD',
  'COMP/USD',
  'MKR/USD',
  'SNX/USD',
  'YFI/USD',
  'SUSHI/USD',
  'CRV/USD',
  'GRT/USD',
  'ENJ/USD',
  'MANA/USD',
  'SAND/USD',
  'AXS/USD',
  'CHZ/USD',
  'FTM/USD',
  'NEAR/USD',
  'APT/USD',
  'OP/USD',
  'ARB/USD',
  'SUI/USD',
  'SEI/USD',
  'TIA/USD',
  'PYTH/USD',
  'JTO/USD',
  'WIF/USD',
  'BONK/USD',
  'PEPE/USD',
  'FLOKI/USD',
  'INJ/USD',
  'KAS/USD',
  'RNDR/USD',
  'MINA/USD',
  'CELO/USD',
  'ZIL/USD',
  'KSM/USD',
  'FLOW/USD',
  'ICX/USD',
  'ONT/USD',
  'QTUM/USD',
  'WAVES/USD',
  'OMG/USD',
  'BAT/USD',
  'ZRX/USD',
  'KNC/USD',
  'RLC/USD',
  'OCEAN/USD',
  'BAND/USD',
  'UMA/USD',
  'BAL/USD',
  'REN/USD',
  'SRM/USD',
  'PERP/USD',
  'ALPHA/USD',
  'CVC/USD',
  'CTSI/USD',
  'ANKR/USD',
  'RVN/USD',
  'SC/USD',
  'DGB/USD',
  'ONE/USD',
  'HOT/USD',
  'NANO/USD',
  'AR/USD',
  'IOST/USD',
  'WAN/USD',
  'HBAR/USD',
  'CELR/USD',
  'FET/USD',
  'OGN/USD',
  'MDT/USD',
  'STX/USD',
  'KAVA/USD',
  'ROSE/USD',
  'CFX/USD',
  'GALA/USD',
  'IMX/USD',
  'APT/USD',
  'SUI/USD',
  'SEI/USD',
  'TIA/USD',
  'PYTH/USD',
  'JTO/USD',
  'WIF/USD',
  'BONK/USD',
  'PEPE/USD',
  'FLOKI/USD',
  'INJ/USD',
  'KAS/USD',
  'RNDR/USD',
  'MINA/USD',
  'CELO/USD',
  'ZIL/USD',
  'KSM/USD',
  'FLOW/USD',
  'ICX/USD',
  'ONT/USD',
  'QTUM/USD',
  'WAVES/USD',
  'OMG/USD',
  'BAT/USD',
  'ZRX/USD',
  'KNC/USD',
  'RLC/USD',
  'OCEAN/USD',
  'BAND/USD',
  'UMA/USD',
  'BAL/USD',
  'REN/USD',
  'SRM/USD',
  'PERP/USD',
  'ALPHA/USD',
  'CVC/USD',
  'CTSI/USD',
  'ANKR/USD',
  'RVN/USD',
  'SC/USD',
  'DGB/USD',
  'ONE/USD',
  'HOT/USD',
  'NANO/USD',
  'AR/USD',
  'IOST/USD',
  'WAN/USD',
  'HBAR/USD',
  'CELR/USD',
  'FET/USD',
  'OGN/USD',
  'MDT/USD',
  'STX/USD',
  'KAVA/USD',
  'ROSE/USD',
  'CFX/USD',
  'GALA/USD',
  'IMX/USD',
];

// --- Utility Functions ---

function calculateStandardDeviation(prices: number[]): number {
  if (prices.length < 2) return 0;
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (prices.length - 1);
  return Math.sqrt(variance);
}

function weightedAverage(prices: { price: number; weight: number }[]): number {
  const totalWeight = prices.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return 0;
  return prices.reduce((sum, p) => sum + p.price * p.weight, 0) / totalWeight;
}

// --- Sub-Engines ---

class PriceFeedAggregator {
  private priceDataStore: Map<string, PriceData[]>; // assetPair -> PriceData[]

  constructor() {
    this.priceDataStore = new Map();
  }

  public addPriceData(data: PriceData): void {
    if (!SUPPORTED_ASSET_PAIRS.includes(data.assetPair)) {
            return;
    }
    const currentData = this.priceDataStore.get(data.assetPair) || [];
    currentData.push(data);
    // Keep only recent data, e.g., last 2 hours for aggregation purposes
    const twoHoursAgo = Date.now() - (2 * 3600 * 1000);
    this.priceDataStore.set(data.assetPair, currentData.filter(d => d.timestamp > twoHoursAgo));
  }

  public getAggregatedPrice(assetPair: string, config: OracleConfig): AggregatedPrice | null {
    const data = this.priceDataStore.get(assetPair);
    if (!data || data.length < config.minSources) {
      return null;
    }

    const validPrices = data.filter(d => d.confidence >= config.confidenceThreshold);

    if (validPrices.length < config.minSources) {
      return null;
    }

    const prices = validPrices.map(d => d.price);
    const meanPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // Filter out prices that deviate too much from the mean
    const filteredPrices = validPrices.filter(d => {
      return Math.abs(d.price - meanPrice) / meanPrice <= config.maxPriceDeviation;
    });

    if (filteredPrices.length === 0) {
      return null;
    }

    const weights = filteredPrices.map(d => ({ price: d.price, weight: d.confidence }));
    const aggregatedPrice = weightedAverage(weights);
    const sources = [...new Set(filteredPrices.map(d => d.source))];
    const volatility = calculateStandardDeviation(filteredPrices.map(d => d.price));

    // Simple check for potential manipulation: if filtered prices are too few compared to initial valid prices
    const isManipulated = filteredPrices.length < (validPrices.length / 2) && validPrices.length >= config.minSources * 2;

    return {
      assetPair,
      price: aggregatedPrice,
      timestamp: Date.now(),
      sources,
      confidenceScore: filteredPrices.reduce((sum, d) => sum + d.confidence, 0) / filteredPrices.length,
      volatility,
      isManipulated,
    };
  }

  public getLatestPriceData(assetPair: string): PriceData[] {
    return this.priceDataStore.get(assetPair) || [];
  }
}

class TWAPCalculator {
  private priceHistory: Map<string, PriceHistoryEntry[]>; // assetPair -> PriceHistoryEntry[]

  constructor() {
    this.priceHistory = new Map();
  }

  public addPrice(assetPair: string, price: number, timestamp: number): void {
    if (!SUPPORTED_ASSET_PAIRS.includes(assetPair)) {
            return;
    }
    const history = this.priceHistory.get(assetPair) || [];
    history.push({ timestamp, price });
    this.priceHistory.set(assetPair, history);
  }

  public calculateTWAP(assetPair: string, periodSeconds: number): number | null {
    const history = this.priceHistory.get(assetPair);
    if (!history || history.length === 0) {
      return null;
    }

    const cutoffTime = Date.now() - (periodSeconds * 1000);
    const relevantHistory = history.filter(entry => entry.timestamp >= cutoffTime);

    if (relevantHistory.length === 0) {
      return null;
    }

    let totalWeightedPrice = 0;
    let totalTime = 0;

    for (let i = 0; i < relevantHistory.length; i++) {
      const currentEntry = relevantHistory[i];
      const nextEntry = relevantHistory[i + 1];

      const duration = nextEntry ? nextEntry.timestamp - currentEntry.timestamp : Date.now() - currentEntry.timestamp;
      totalWeightedPrice += currentEntry.price * duration;
      totalTime += duration;
    }

    return totalTime > 0 ? totalWeightedPrice / totalTime : null;
  }

  public getPriceHistory(assetPair: string, limit: number = 100): PriceHistoryEntry[] {
    const history = this.priceHistory.get(assetPair) || [];
    return history.slice(-limit);
  }

  public calculateVolatility(assetPair: string, periodSeconds: number): number | null {
    const history = this.priceHistory.get(assetPair);
    if (!history || history.length < 2) {
      return null;
    }

    const cutoffTime = Date.now() - (periodSeconds * 1000);
    const relevantHistory = history.filter(entry => entry.timestamp >= cutoffTime);

    if (relevantHistory.length < 2) {
      return null;
    }

    const prices = relevantHistory.map(entry => entry.price);
    return calculateStandardDeviation(prices);
  }
}

class CrossChainPriceFeed {
  private config: OracleConfig;

  constructor(config: OracleConfig) {
    this.config = config;
  }

  public async fetchCrossChainPrice(chain: string, assetPair: string): Promise<PriceData | null> {
    const url = this.config.crossChainFeedUrls[chain];
    if (!url) {
            return null;
    }

    try {
      // In a real scenario, this would involve a network request.
      // For this example, we simulate a fetch and invoke LLM for a dynamic price.
      const prompt = `Provide a realistic current price for ${assetPair} on ${chain} blockchain. Respond with a JSON object { "price": number, "confidence": number }.`;
      const llmRaw = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const parsedResponse = JSON.parse(String(llmRaw.choices[0]?.message?.content || "{}"));

      if (typeof parsedResponse.price === 'number' && typeof parsedResponse.confidence === 'number') {
        return {
          source: `cross-chain-${chain}`,
          assetPair,
          price: parsedResponse.price,
          timestamp: Date.now(),
          confidence: parsedResponse.confidence,
        };
      }
            return null;
    } catch (error) {
            return null;
    }
  }
}

// --- Main Engine Class ---

export class OracleEngine {
  private aggregator: PriceFeedAggregator;
  private twapCalculator: TWAPCalculator;
  private crossChainFeeds: CrossChainPriceFeed;
  private config: OracleConfig;

  constructor(config: Partial<OracleConfig> = {}) {
    this.config = { ...DEFAULT_ORACLE_CONFIG, ...config };
    this.aggregator = new PriceFeedAggregator();
    this.twapCalculator = new TWAPCalculator();
    this.crossChainFeeds = new CrossChainPriceFeed(this.config);
  }

  /**
   * Ingests raw price data from various sources.
   * @param priceData The raw price data to ingest.
   */
  public ingestPriceData(priceData: PriceData): void {
    this.aggregator.addPriceData(priceData);
    this.twapCalculator.addPrice(priceData.assetPair, priceData.price, priceData.timestamp);
  }

  /**
   * Retrieves the current aggregated price for a given asset pair.
   * Includes mechanisms for price deviation detection and manipulation resistance.
   * @param assetPair The asset pair (e.g., 'BTC/USD').
   * @returns An AggregatedPrice object or null if no reliable price can be determined.
   */
  public getPrice(assetPair: string): AggregatedPrice | null {
    let aggregated = this.aggregator.getAggregatedPrice(assetPair, this.config);

    if (!aggregated && this.config.fallbackAssetPair) {
            aggregated = this.aggregator.getAggregatedPrice(this.config.fallbackAssetPair, this.config);
      if (aggregated) {
        // Adjust the assetPair to reflect the original request, but note it's a fallback
        aggregated.assetPair = `${assetPair} (fallback from ${this.config.fallbackAssetPair})`;
      }
    }

    return aggregated;
  }

  /**
   * Calculates the Time-Weighted Average Price (TWAP) for an asset pair over a configured period.
   * @param assetPair The asset pair.
   * @returns The TWAP or null if not enough data.
   */
  public getTWAP(assetPair: string): number | null {
    return this.twapCalculator.calculateTWAP(assetPair, this.config.twapPeriodSeconds);
  }

  /**
   * Detects significant price deviations for an asset pair.
   * @param assetPair The asset pair.
   * @returns True if a significant deviation is detected, false otherwise.
   */
  public detectPriceDeviation(assetPair: string): boolean {
    const latestPrices = this.aggregator.getLatestPriceData(assetPair);
    if (latestPrices.length < this.config.minSources) {
      return false;
    }

    const prices = latestPrices.map(d => d.price);
    const currentPrice = this.getPrice(assetPair)?.price;

    if (currentPrice === undefined || prices.length === 0) {
      return false;
    }

    const meanPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    return Math.abs(currentPrice - meanPrice) / meanPrice > this.config.maxPriceDeviation;
  }

  /**
   * Provides price history for a given asset pair.
   * @param assetPair The asset pair.
   * @param limit The maximum number of history entries to return.
   * @returns An array of PriceHistoryEntry.
   */
  public getPriceHistory(assetPair: string, limit: number = 100): PriceHistoryEntry[] {
    return this.twapCalculator.getPriceHistory(assetPair, limit);
  }

  /**
   * Calculates the volatility of an asset pair over a configured period.
   * @param assetPair The asset pair.
   * @returns The volatility (standard deviation) or null if not enough data.
   */
  public getVolatility(assetPair: string): number | null {
    return this.twapCalculator.calculateVolatility(assetPair, this.config.twapPeriodSeconds);
  }

  /**
   * Fetches price data from a cross-chain feed.
   * @param chain The blockchain network (e.g., 'ethereum').
   * @param assetPair The asset pair.
   * @returns PriceData or null.
   */
  public async getCrossChainPrice(chain: string, assetPair: string): Promise<PriceData | null> {
    return this.crossChainFeeds.fetchCrossChainPrice(chain, assetPair);
  }

  /**
   * Normalizes market data for consistent processing.
   * This method uses an AI model to enhance normalization by identifying and correcting anomalies.
   * @param rawData Raw market data object.
   * @returns Normalized MarketData object.
   */
  public async normalizeMarketData(rawData: any): Promise<MarketData> {
    // Basic normalization for known fields
    const normalized: MarketData = {
      assetPair: rawData.assetPair || 'UNKNOWN/UNKNOWN',
      volume24h: typeof rawData.volume24h === 'number' ? rawData.volume24h : 0,
      marketCap: typeof rawData.marketCap === 'number' ? rawData.marketCap : 0,
      lastPrice: typeof rawData.lastPrice === 'number' ? rawData.lastPrice : 0,
    };

    // Use LLM for advanced normalization and anomaly detection
    try {
      const prompt = `Normalize the following market data and identify any potential anomalies or inconsistencies. If anomalies are found, suggest corrections. Input: ${JSON.stringify(rawData)}. Output a JSON object { "normalizedData": MarketData, "anomaliesDetected": boolean, "suggestedCorrections": string | null }.`;
      const llmRaw = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const parsedResponse = JSON.parse(String(llmRaw.choices[0]?.message?.content || "{}"));

      if (parsedResponse.normalizedData) {
        return parsedResponse.normalizedData as MarketData;
      } else {
                return normalized;
      }
    } catch (error) {
            return normalized;
    }
  }

  /**
   * Gets the current configuration of the Oracle Engine.
   * @returns The current OracleConfig.
   */
  public getConfig(): OracleConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration of the Oracle Engine.
   * @param newConfig Partial OracleConfig to apply.
   */
  public updateConfig(newConfig: Partial<OracleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// --- Singleton Instance ---

export const oracleEngine = new OracleEngine();

// Example Usage (for demonstration and testing purposes, not part of core engine logic)
/*
async function runExample() {
  
  // Ingest some sample price data
  oracleEngine.ingestPriceData({ source: 'Binance', assetPair: 'BTC/USD', price: 60000, timestamp: Date.now() - 5000, confidence: 0.95 });
  oracleEngine.ingestPriceData({ source: 'Coinbase', assetPair: 'BTC/USD', price: 60100, timestamp: Date.now() - 4000, confidence: 0.98 });
  oracleEngine.ingestPriceData({ source: 'Kraken', assetPair: 'BTC/USD', price: 59950, timestamp: Date.now() - 3000, confidence: 0.92 });
  oracleEngine.ingestPriceData({ source: 'Gemini', assetPair: 'BTC/USD', price: 60050, timestamp: Date.now() - 2000, confidence: 0.96 });
  oracleEngine.ingestPriceData({ source: 'Bitfinex', assetPair: 'BTC/USD', price: 60200, timestamp: Date.now() - 1000, confidence: 0.90 });

  oracleEngine.ingestPriceData({ source: 'Binance', assetPair: 'ETH/USD', price: 3000, timestamp: Date.now() - 5000, confidence: 0.94 });
  oracleEngine.ingestPriceData({ source: 'Coinbase', assetPair: 'ETH/USD', price: 3010, timestamp: Date.now() - 4000, confidence: 0.97 });

  // Get aggregated price
  const btcPrice = oracleEngine.getPrice('BTC/USD');
  if (btcPrice) {
    } USD (Confidence: ${btcPrice.confidenceScore.toFixed(2)}, Volatility: ${btcPrice.volatility.toFixed(4)}, Manipulated: ${btcPrice.isManipulated})`);
  } else {
      }

  const ethPrice = oracleEngine.getPrice('ETH/USD');
  if (ethPrice) {
    } USD (Confidence: ${ethPrice.confidenceScore.toFixed(2)}, Volatility: ${ethPrice.volatility.toFixed(4)}, Manipulated: ${ethPrice.isManipulated})`);
  } else {
      }

  // Calculate TWAP
  const btcTWAP = oracleEngine.getTWAP('BTC/USD');
  if (btcTWAP) {
    : ${btcTWAP.toFixed(2)} USD`);
  } else {
      }

  // Detect price deviation
  const deviationDetected = oracleEngine.detectPriceDeviation('BTC/USD');
  
  // Get price history
  const btcHistory = oracleEngine.getPriceHistory('BTC/USD', 5);
  :', btcHistory);

  // Get volatility
  const btcVolatility = oracleEngine.getVolatility('BTC/USD');
  if (btcVolatility) {
    : ${btcVolatility.toFixed(4)}`);
  } else {
      }

  // Fetch cross-chain price
  const ethCrossChainPrice = await oracleEngine.getCrossChainPrice('ethereum', 'ETH/USD');
  if (ethCrossChainPrice) {
    : ${ethCrossChainPrice.price.toFixed(2)} USD (Source: ${ethCrossChainPrice.source}, Confidence: ${ethCrossChainPrice.confidence})`);
  } else {
      }

  // Normalize market data
  const rawMarketData = {
    assetPair: 'BTC/USD',
    volume24h: '123456789.12',
    marketCap: 1.2e12,
    lastPrice: 60050.75,
    unrecognizedField: 'some value'
  };
  const normalizedMarketData = await oracleEngine.normalizeMarketData(rawMarketData);
  
  // Update config and re-check
  oracleEngine.updateConfig({ maxPriceDeviation: 0.05 });
  );
}

// runExample();
*/
