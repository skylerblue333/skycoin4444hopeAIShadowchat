import crypto from 'crypto';
/**
 * Live Price Feed — CoinGecko API with 60-second server-side cache
 */

interface PriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
}

interface CacheEntry {
  data: PriceData[];
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 60_000; // 60 seconds

const COIN_IDS = [
  "bitcoin", "ethereum", "solana", "binancecoin", "cardano",
  "polkadot", "chainlink", "uniswap", "avalanche-2", "matic-network"
];

// SKY444 simulated token data
const SKY444_DATA: PriceData = {
  id: "sky444",
  symbol: "sky444",
  name: "SKYCOIN4444",
  current_price: 0.0888,
  price_change_percentage_24h: 4.44,
  market_cap: 88_800_000,
  total_volume: 4_440_000,
  image: "",
};

export async function fetchLivePrices(): Promise<PriceData[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS.join(",")}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
    const data = await response.json() as PriceData[];
    const withSky = [SKY444_DATA, ...data];
    cache = { data: withSky, fetchedAt: now };
    return withSky;
  } catch (err) {
        // Fallback static prices
    const fallback: PriceData[] = [
      SKY444_DATA,
      { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 69420, price_change_percentage_24h: 1.23, market_cap: 1_360_000_000_000, total_volume: 28_000_000_000, image: "" },
      { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3880, price_change_percentage_24h: 2.11, market_cap: 466_000_000_000, total_volume: 14_000_000_000, image: "" },
      { id: "solana", symbol: "sol", name: "Solana", current_price: 172, price_change_percentage_24h: -0.88, market_cap: 80_000_000_000, total_volume: 3_200_000_000, image: "" },
      { id: "binancecoin", symbol: "bnb", name: "BNB", current_price: 598, price_change_percentage_24h: 0.44, market_cap: 87_000_000_000, total_volume: 1_800_000_000, image: "" },
      { id: "cardano", symbol: "ada", name: "Cardano", current_price: 0.48, price_change_percentage_24h: -1.2, market_cap: 17_000_000_000, total_volume: 440_000_000, image: "" },
    ];
    if (!cache) cache = { data: fallback, fetchedAt: now };
    return cache.data;
  }
}

export async function fetchTokenPrice(coinId: string): Promise<number | null> {
  const prices = await fetchLivePrices();
  const coin = prices.find(p => p.id === coinId || p.symbol === coinId.toLowerCase());
  return coin?.current_price ?? null;
}

// ═══════════════════════════════════════════════════════════════
// PRICE FEED ENGINE v2 — Extended Market Data
// ═══════════════════════════════════════════════════════════════

export interface ExtendedPriceData extends PriceData {
  high_24h: number;
  low_24h: number;
  ath: number;
  ath_change_percentage: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  sparkline?: number[];
}

export interface OHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceAlert {
  id: string;
  userId: number;
  coinId: string;
  targetPrice: number;
  direction: "above" | "below";
  triggered: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface MarketSummary {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  activeCoins: number;
  marketCapChange24h: number;
  timestamp: number;
}

export interface PortfolioValuation {
  totalValueUSD: number;
  totalValueBTC: number;
  holdings: Array<{
    coinId: string;
    symbol: string;
    amount: number;
    priceUSD: number;
    valueUSD: number;
    allocation: number;
    change24h: number;
    pnlUSD: number;
    pnlPercent: number;
    costBasis?: number;
  }>;
  totalPnlUSD: number;
  totalPnlPercent: number;
  bestPerformer: string;
  worstPerformer: string;
}

export interface TrendSignal {
  coinId: string;
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  confidence: number;
  indicators: {
    rsi: number;
    macdSignal: "bullish" | "bearish" | "neutral";
    volumeSpike: boolean;
    priceAboveMa20: boolean;
    priceAboveMa50: boolean;
    bollingerPosition: "upper" | "middle" | "lower";
  };
  reasoning: string[];
  timestamp: number;
}

// ─── Extended Caches ─────────────────────────────────────────

const ohlcvCache = new Map<string, { data: OHLCVBar[]; fetchedAt: number }>();
const priceHistoryCache = new Map<string, { prices: [number, number][]; fetchedAt: number }>();
const priceAlerts: PriceAlert[] = [];
const portfolioSnapshots = new Map<number, { snapshot: PortfolioValuation; timestamp: number }>();
let marketSummaryCache: { data: MarketSummary; fetchedAt: number } | null = null;

const OHLCV_CACHE_TTL = 5 * 60_000;
const MARKET_SUMMARY_TTL = 2 * 60_000;

// ─── All Supported Tokens ─────────────────────────────────────

export const ALL_SUPPORTED_TOKENS = [
  { id: "sky444",          symbol: "SKY444",  name: "SKYCOIN4444",     decimals: 18, mineable: true,  isNative: true  },
  { id: "bitcoin",         symbol: "BTC",     name: "Bitcoin",         decimals: 8,  mineable: true,  isNative: false },
  { id: "ethereum",        symbol: "ETH",     name: "Ethereum",        decimals: 18, mineable: false, isNative: false },
  { id: "solana",          symbol: "SOL",     name: "Solana",          decimals: 9,  mineable: false, isNative: false },
  { id: "dogecoin",        symbol: "DOGE",    name: "Dogecoin",        decimals: 8,  mineable: true,  isNative: false },
  { id: "tether",          symbol: "USDT",    name: "Tether",          decimals: 6,  mineable: false, isNative: false },
  { id: "monero",          symbol: "XMR",     name: "Monero",          decimals: 12, mineable: true,  isNative: false },
  { id: "trump",           symbol: "TRUMP",   name: "Official Trump",  decimals: 6,  mineable: true,  isNative: false },
  { id: "binancecoin",     symbol: "BNB",     name: "BNB",             decimals: 18, mineable: false, isNative: false },
  { id: "cardano",         symbol: "ADA",     name: "Cardano",         decimals: 6,  mineable: false, isNative: false },
  { id: "polkadot",        symbol: "DOT",     name: "Polkadot",        decimals: 10, mineable: false, isNative: false },
  { id: "chainlink",       symbol: "LINK",    name: "Chainlink",       decimals: 18, mineable: false, isNative: false },
  { id: "uniswap",         symbol: "UNI",     name: "Uniswap",         decimals: 18, mineable: false, isNative: false },
  { id: "avalanche-2",     symbol: "AVAX",    name: "Avalanche",       decimals: 18, mineable: false, isNative: false },
  { id: "matic-network",   symbol: "MATIC",   name: "Polygon",         decimals: 18, mineable: false, isNative: false },
];

export const MINEABLE_TOKENS = ALL_SUPPORTED_TOKENS.filter(t => t.mineable).map(t => t.id);

// ─── Fallback Prices ─────────────────────────────────────────

const FALLBACK_PRICES: Record<string, Partial<ExtendedPriceData>> = {
  sky444:        { current_price: 0.0888,   price_change_percentage_24h: 4.44,   market_cap: 88_800_000,          total_volume: 4_440_000,        high_24h: 0.0944,   low_24h: 0.0832,  ath: 0.444,    ath_change_percentage: -80, circulating_supply: 1_000_000_000, total_supply: 4_444_444_444, max_supply: 4_444_444_444 },
  bitcoin:       { current_price: 69_420,   price_change_percentage_24h: 1.23,   market_cap: 1_360_000_000_000,   total_volume: 28_000_000_000,   high_24h: 71_000,   low_24h: 68_200,  ath: 73_750,   ath_change_percentage: -5.9, circulating_supply: 19_700_000, total_supply: 21_000_000, max_supply: 21_000_000 },
  ethereum:      { current_price: 3_880,    price_change_percentage_24h: 2.11,   market_cap: 466_000_000_000,     total_volume: 14_000_000_000,   high_24h: 3_960,    low_24h: 3_780,   ath: 4_878,    ath_change_percentage: -20.5, circulating_supply: 120_000_000, total_supply: null, max_supply: null },
  solana:        { current_price: 172,      price_change_percentage_24h: -0.88,  market_cap: 80_000_000_000,      total_volume: 3_200_000_000,    high_24h: 178,      low_24h: 168,     ath: 260,      ath_change_percentage: -33.8, circulating_supply: 465_000_000, total_supply: null, max_supply: null },
  dogecoin:      { current_price: 0.165,    price_change_percentage_24h: 3.21,   market_cap: 24_000_000_000,      total_volume: 1_200_000_000,    high_24h: 0.172,    low_24h: 0.158,   ath: 0.74,     ath_change_percentage: -77.7, circulating_supply: 145_000_000_000, total_supply: null, max_supply: null },
  tether:        { current_price: 1.0,      price_change_percentage_24h: 0.01,   market_cap: 110_000_000_000,     total_volume: 50_000_000_000,   high_24h: 1.001,    low_24h: 0.999,   ath: 1.32,     ath_change_percentage: -24.2, circulating_supply: 110_000_000_000, total_supply: 110_000_000_000, max_supply: null },
  monero:        { current_price: 168,      price_change_percentage_24h: 1.55,   market_cap: 3_100_000_000,       total_volume: 88_000_000,       high_24h: 172,      low_24h: 164,     ath: 517,      ath_change_percentage: -67.5, circulating_supply: 18_400_000, total_supply: null, max_supply: null },
  trump:         { current_price: 14.22,    price_change_percentage_24h: 8.88,   market_cap: 2_844_000_000,       total_volume: 444_000_000,      high_24h: 15.44,    low_24h: 12.88,   ath: 75.35,    ath_change_percentage: -81.1, circulating_supply: 200_000_000, total_supply: 1_000_000_000, max_supply: 1_000_000_000 },
  binancecoin:   { current_price: 598,      price_change_percentage_24h: 0.44,   market_cap: 87_000_000_000,      total_volume: 1_800_000_000,    high_24h: 612,      low_24h: 590,     ath: 686,      ath_change_percentage: -12.8, circulating_supply: 145_000_000, total_supply: 145_000_000, max_supply: 200_000_000 },
  cardano:       { current_price: 0.48,     price_change_percentage_24h: -1.2,   market_cap: 17_000_000_000,      total_volume: 440_000_000,      high_24h: 0.495,    low_24h: 0.468,   ath: 3.10,     ath_change_percentage: -84.5, circulating_supply: 35_000_000_000, total_supply: 45_000_000_000, max_supply: 45_000_000_000 },
};

// ─── Simulated Price Drift (for SKY444 and TRUMP) ────────────

const priceSeeds = new Map<string, number>();
function simulatedPrice(coinId: string, basePrice: number): number {
  const seed = priceSeeds.get(coinId) || (crypto.getRandomValues(new Uint8Array(1))[0] / 256);
  priceSeeds.set(coinId, seed);
  const drift = (Math.sin(Date.now() / 60_000 + seed * 100) * 0.02) + ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 0.005;
  return Math.max(basePrice * 0.5, basePrice * (1 + drift));
}

// ─── Fetch Extended Prices ────────────────────────────────────

export async function fetchExtendedPrices(): Promise<ExtendedPriceData[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.data as ExtendedPriceData[];
  }
  const coinIds = ALL_SUPPORTED_TOKENS.filter(t => t.id !== "sky444" && t.id !== "trump").map(t => t.id);
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(",")}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d,30d`;
    const response = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
    const data = await response.json() as ExtendedPriceData[];
    const sky444: ExtendedPriceData = {
      ...(FALLBACK_PRICES.sky444 as ExtendedPriceData),
      id: "sky444", symbol: "sky444", name: "SKYCOIN4444",
      current_price: simulatedPrice("sky444", FALLBACK_PRICES.sky444.current_price!),
      image: "",
    };
    const trump: ExtendedPriceData = {
      ...(FALLBACK_PRICES.trump as ExtendedPriceData),
      id: "trump", symbol: "trump", name: "Official Trump",
      current_price: simulatedPrice("trump", FALLBACK_PRICES.trump.current_price!),
      image: "",
    };
    const withCustom = [sky444, trump, ...data];
    cache = { data: withCustom, fetchedAt: now };
    return withCustom;
  } catch {
    return buildFallbackPrices();
  }
}

function buildFallbackPrices(): ExtendedPriceData[] {
  return ALL_SUPPORTED_TOKENS.map(token => {
    const fb = FALLBACK_PRICES[token.id] || {};
    const base = fb.current_price || 1;
    return {
      id: token.id, symbol: token.symbol.toLowerCase(), name: token.name,
      current_price: simulatedPrice(token.id, base),
      price_change_percentage_24h: fb.price_change_percentage_24h || ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 10,
      market_cap: fb.market_cap || base * 1_000_000,
      total_volume: fb.total_volume || base * 100_000,
      high_24h: fb.high_24h || base * 1.05,
      low_24h: fb.low_24h || base * 0.95,
      ath: fb.ath || base * 3,
      ath_change_percentage: fb.ath_change_percentage || -50,
      circulating_supply: fb.circulating_supply || 1_000_000_000,
      total_supply: fb.total_supply ?? null,
      max_supply: fb.max_supply ?? null,
      image: "",
    } as ExtendedPriceData;
  });
}

// ─── OHLCV Data ───────────────────────────────────────────────

export async function fetchOHLCV(coinId: string, days = 7): Promise<OHLCVBar[]> {
  const cacheKey = `${coinId}:${days}`;
  const cached = ohlcvCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < OHLCV_CACHE_TTL) return cached.data;
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OHLCV HTTP ${res.status}`);
    const raw = await res.json() as [number, number, number, number, number][];
    const bars: OHLCVBar[] = raw.map(([ts, o, h, l, c]) => ({ timestamp: ts, open: o, high: h, low: l, close: c, volume: 0 }));
    ohlcvCache.set(cacheKey, { data: bars, fetchedAt: Date.now() });
    return bars;
  } catch {
    return generateSimulatedOHLCV(coinId, days);
  }
}

function generateSimulatedOHLCV(coinId: string, days: number): OHLCVBar[] {
  const fb = FALLBACK_PRICES[coinId];
  const basePrice = fb?.current_price || 1;
  const bars: OHLCVBar[] = [];
  const now = Date.now();
  let price = basePrice * 0.85;
  for (let i = days * 24; i >= 0; i--) {
    const change = ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.48) * 0.02;
    price = Math.max(price * 0.5, price * (1 + change));
    const high = price * (1 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.01);
    const low = price * (1 - (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.01);
    const open = price * (1 + ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 0.005);
    bars.push({ timestamp: now - i * 3_600_000, open, high, low, close: price, volume: basePrice * 1_000_000 * (crypto.getRandomValues(new Uint8Array(1))[0] / 256) });
  }
  return bars;
}

// ─── Price History ────────────────────────────────────────────

export async function fetchPriceHistory(coinId: string, days = 30): Promise<[number, number][]> {
  const cacheKey = `hist:${coinId}:${days}`;
  const cached = priceHistoryCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < OHLCV_CACHE_TTL) return cached.prices;
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`History HTTP ${res.status}`);
    const data = await res.json() as { prices: [number, number][] };
    priceHistoryCache.set(cacheKey, { prices: data.prices, fetchedAt: Date.now() });
    return data.prices;
  } catch {
    const fb = FALLBACK_PRICES[coinId];
    const base = fb?.current_price || 1;
    const prices: [number, number][] = [];
    const now = Date.now();
    let p = base * 0.8;
    for (let i = days; i >= 0; i--) {
      p = p * (1 + ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.48) * 0.03);
      prices.push([now - i * 86_400_000, p]);
    }
    return prices;
  }
}

// ─── Market Summary ───────────────────────────────────────────

export async function fetchMarketSummary(): Promise<MarketSummary> {
  if (marketSummaryCache && Date.now() - marketSummaryCache.fetchedAt < MARKET_SUMMARY_TTL) {
    return marketSummaryCache.data;
  }
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Global HTTP ${res.status}`);
    const json = await res.json() as { data: { total_market_cap: Record<string, number>; total_volume: Record<string, number>; market_cap_percentage: Record<string, number>; market_cap_change_percentage_24h_usd: number; active_cryptocurrencies: number } };
    const d = json.data;
    const fearGreed = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100);
    const summary: MarketSummary = {
      totalMarketCap: d.total_market_cap.usd || 2_500_000_000_000,
      totalVolume24h: d.total_volume.usd || 80_000_000_000,
      btcDominance: d.market_cap_percentage.btc || 52,
      ethDominance: d.market_cap_percentage.eth || 18,
      fearGreedIndex: fearGreed,
      fearGreedLabel: fearGreedLabel(fearGreed),
      activeCoins: d.active_cryptocurrencies || 12_000,
      marketCapChange24h: d.market_cap_change_percentage_24h_usd || 0,
      timestamp: Date.now(),
    };
    marketSummaryCache = { data: summary, fetchedAt: Date.now() };
    return summary;
  } catch {
    const fearGreed = 55 + Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20);
    return { totalMarketCap: 2_500_000_000_000, totalVolume24h: 80_000_000_000, btcDominance: 52.4, ethDominance: 17.8, fearGreedIndex: fearGreed, fearGreedLabel: fearGreedLabel(fearGreed), activeCoins: 12_847, marketCapChange24h: 1.2, timestamp: Date.now() };
  }
}

function fearGreedLabel(index: number): string {
  if (index <= 20) return "Extreme Fear";
  if (index <= 40) return "Fear";
  if (index <= 60) return "Neutral";
  if (index <= 80) return "Greed";
  return "Extreme Greed";
}

// ─── Portfolio Valuation ──────────────────────────────────────

export async function valuatePortfolio(holdings: Array<{ coinId: string; amount: number; costBasis?: number }>): Promise<PortfolioValuation> {
  const prices = await fetchExtendedPrices();
  const priceMap = new Map(prices.map(p => [p.id, p]));
  const btcPrice = priceMap.get("bitcoin")?.current_price || 69_420;
  let totalValueUSD = 0;
  let totalCostBasis = 0;
  let bestChange = -Infinity;
  let worstChange = Infinity;
  let bestCoin = "";
  let worstCoin = "";
  const valuatedHoldings = holdings.map(h => {
    const priceData = priceMap.get(h.coinId);
    const priceUSD = priceData?.current_price || 0;
    const valueUSD = h.amount * priceUSD;
    const change24h = priceData?.price_change_percentage_24h || 0;
    const costBasis = h.costBasis || 0;
    const pnlUSD = costBasis > 0 ? valueUSD - costBasis : 0;
    const pnlPercent = costBasis > 0 ? (pnlUSD / costBasis) * 100 : 0;
    totalValueUSD += valueUSD;
    totalCostBasis += costBasis;
    if (change24h > bestChange) { bestChange = change24h; bestCoin = h.coinId; }
    if (change24h < worstChange) { worstChange = change24h; worstCoin = h.coinId; }
    return { coinId: h.coinId, symbol: priceData?.symbol || h.coinId, amount: h.amount, priceUSD, valueUSD, allocation: 0, change24h, pnlUSD, pnlPercent, costBasis };
  });
  valuatedHoldings.forEach(h => { h.allocation = totalValueUSD > 0 ? (h.valueUSD / totalValueUSD) * 100 : 0; });
  const totalPnlUSD = totalCostBasis > 0 ? totalValueUSD - totalCostBasis : 0;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnlUSD / totalCostBasis) * 100 : 0;
  return { totalValueUSD, totalValueBTC: totalValueUSD / btcPrice, holdings: valuatedHoldings, totalPnlUSD, totalPnlPercent, bestPerformer: bestCoin, worstPerformer: worstCoin };
}

// ─── Technical Analysis / Trend Signals ──────────────────────

export async function computeTrendSignal(coinId: string): Promise<TrendSignal> {
  const history = await fetchPriceHistory(coinId, 60);
  const closes = history.map(([, p]) => p);
  const rsi = computeRSI(closes, 14);
  const ma20 = computeMA(closes, 20);
  const ma50 = computeMA(closes, 50);
  const currentPrice = closes[closes.length - 1] || 0;
  const { upper, lower } = computeBollinger(closes, 20);
  const macdSignal = computeMACDSignal(closes);
  const volumeSpike = false;
  const priceAboveMa20 = currentPrice > ma20;
  const priceAboveMa50 = currentPrice > ma50;
  const bollingerPosition: TrendSignal["indicators"]["bollingerPosition"] =
    currentPrice >= upper ? "upper" : currentPrice <= lower ? "lower" : "middle";
  let score = 0;
  const reasoning: string[] = [];
  if (rsi < 30) { score += 2; reasoning.push(`RSI oversold (${rsi.toFixed(1)})`); }
  else if (rsi > 70) { score -= 2; reasoning.push(`RSI overbought (${rsi.toFixed(1)})`); }
  if (macdSignal === "bullish") { score += 1; reasoning.push("MACD bullish crossover"); }
  else if (macdSignal === "bearish") { score -= 1; reasoning.push("MACD bearish crossover"); }
  if (priceAboveMa20) { score += 1; reasoning.push("Price above MA20"); }
  if (priceAboveMa50) { score += 1; reasoning.push("Price above MA50"); }
  if (bollingerPosition === "lower") { score += 1; reasoning.push("Near Bollinger lower band"); }
  else if (bollingerPosition === "upper") { score -= 1; reasoning.push("Near Bollinger upper band"); }
  let signal: TrendSignal["signal"] = "neutral";
  if (score >= 3) signal = "strong_buy";
  else if (score >= 1) signal = "buy";
  else if (score <= -3) signal = "strong_sell";
  else if (score <= -1) signal = "sell";
  return { coinId, signal, confidence: Math.min(95, Math.abs(score) * 20 + 40), indicators: { rsi, macdSignal, volumeSpike, priceAboveMa20, priceAboveMa50, bollingerPosition }, reasoning, timestamp: Date.now() };
}

function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function computeBollinger(prices: number[], period = 20): { upper: number; middle: number; lower: number } {
  const ma = computeMA(prices, period);
  if (prices.length < period) return { upper: ma * 1.02, middle: ma, lower: ma * 0.98 };
  const slice = prices.slice(-period);
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - ma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: ma + 2 * stdDev, middle: ma, lower: ma - 2 * stdDev };
}

function computeMACDSignal(prices: number[]): "bullish" | "bearish" | "neutral" {
  if (prices.length < 26) return "neutral";
  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);
  const macd = ema12 - ema26;
  const prevEma12 = computeEMA(prices.slice(0, -1), 12);
  const prevEma26 = computeEMA(prices.slice(0, -1), 26);
  const prevMacd = prevEma12 - prevEma26;
  if (macd > 0 && prevMacd <= 0) return "bullish";
  if (macd < 0 && prevMacd >= 0) return "bearish";
  return "neutral";
}

function computeEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return ema;
}

// ─── Price Alerts ─────────────────────────────────────────────

export function createPriceAlert(userId: number, coinId: string, targetPrice: number, direction: "above" | "below"): PriceAlert {
  const alert: PriceAlert = { id: `alert_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`, userId, coinId, targetPrice, direction, triggered: false, createdAt: Date.now() };
  priceAlerts.push(alert);
  return alert;
}

export async function checkPriceAlerts(): Promise<PriceAlert[]> {
  const prices = await fetchExtendedPrices();
  const priceMap = new Map(prices.map(p => [p.id, p.current_price]));
  const triggered: PriceAlert[] = [];
  for (const alert of priceAlerts) {
    if (alert.triggered) continue;
    const currentPrice = priceMap.get(alert.coinId);
    if (currentPrice === undefined) continue;
    const hit = alert.direction === "above" ? currentPrice >= alert.targetPrice : currentPrice <= alert.targetPrice;
    if (hit) { alert.triggered = true; alert.triggeredAt = Date.now(); triggered.push(alert); }
  }
  return triggered;
}

export function getUserPriceAlerts(userId: number): PriceAlert[] {
  return priceAlerts.filter(a => a.userId === userId);
}

export function deletePriceAlert(alertId: string, userId: number): boolean {
  const idx = priceAlerts.findIndex(a => a.id === alertId && a.userId === userId);
  if (idx === -1) return false;
  priceAlerts.splice(idx, 1);
  return true;
}

// ─── Swap Rate Engine ─────────────────────────────────────────

export async function getSwapRate(fromCoinId: string, toCoinId: string, amount: number): Promise<{
  fromAmount: number; toAmount: number; rate: number; priceImpact: number; fee: number; feeAmount: number; minReceived: number; slippage: number;
}> {
  const prices = await fetchExtendedPrices();
  const priceMap = new Map(prices.map(p => [p.id, p.current_price]));
  const fromPrice = priceMap.get(fromCoinId) || 1;
  const toPrice = priceMap.get(toCoinId) || 1;
  const usdValue = amount * fromPrice;
  const fee = 0.003;
  const feeAmount = usdValue * fee;
  const netUSD = usdValue - feeAmount;
  const toAmount = netUSD / toPrice;
  const priceImpact = Math.min(5, (usdValue / 1_000_000) * 0.1);
  const slippage = 0.5;
  const minReceived = toAmount * (1 - slippage / 100);
  return { fromAmount: amount, toAmount, rate: fromPrice / toPrice, priceImpact, fee: fee * 100, feeAmount, minReceived, slippage };
}

// ─── Staking APY Engine ───────────────────────────────────────

export function getStakingAPY(coinId: string, lockDays: number): { apy: number; dailyRate: number; projectedReward: number } {
  const baseAPYs: Record<string, number> = {
    sky444: 44.4, bitcoin: 3.5, ethereum: 4.2, solana: 6.8, dogecoin: 8.0,
    tether: 5.0, monero: 2.5, trump: 22.2, binancecoin: 5.5, cardano: 4.8,
  };
  const baseAPY = baseAPYs[coinId] || 5.0;
  const lockBonus = lockDays >= 365 ? 1.5 : lockDays >= 90 ? 1.2 : lockDays >= 30 ? 1.1 : 1.0;
  const apy = baseAPY * lockBonus;
  const dailyRate = apy / 365 / 100;
  const projectedReward = dailyRate * lockDays;
  return { apy, dailyRate, projectedReward };
}

// ─── Mining Reward Engine ─────────────────────────────────────

export function computeMiningReward(coinId: string, hashRatePercent: number, durationSeconds: number): { reward: number; usdValue: number; hashRate: string; efficiency: number } {
  const miningRates: Record<string, number> = {
    sky444: 100,    // tokens per hour at 100% hashrate
    bitcoin: 0.000001,
    dogecoin: 0.5,
    monero: 0.002,
    trump: 0.1,
  };
  const baseRate = miningRates[coinId] || 0.001;
  const efficiency = Math.min(1, hashRatePercent / 100);
  const hoursElapsed = durationSeconds / 3600;
  const reward = baseRate * efficiency * hoursElapsed;
  const hashRateMH = hashRatePercent * 0.5;
  return { reward, usdValue: 0, hashRate: `${hashRateMH.toFixed(1)} MH/s`, efficiency };
}

// ─── End of price-feed engine v2 ────────────────────────────
