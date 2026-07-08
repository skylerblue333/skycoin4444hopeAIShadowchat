import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  color: string;
}

const INITIAL_PRICES: PriceData[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67420.50, change24h: 2.34, color: "oklch(0.80 0.15 60)" },
  { symbol: "ETH", name: "Ethereum", price: 3891.20, change24h: -1.12, color: "oklch(0.75 0.18 280)" },
  { symbol: "SKY444", name: "SKYCOIN4444", price: 4.44, change24h: 44.4, color: "oklch(0.72 0.28 305)" },
  { symbol: "SOL", name: "Solana", price: 189.30, change24h: 5.67, color: "oklch(0.78 0.22 310)" },
  { symbol: "BNB", name: "BNB", price: 612.80, change24h: 0.89, color: "oklch(0.82 0.18 80)" },
  { symbol: "MATIC", name: "Polygon", price: 0.89, change24h: -2.45, color: "oklch(0.72 0.28 305)" },
  { symbol: "AVAX", name: "Avalanche", price: 38.90, change24h: 3.21, color: "oklch(0.75 0.25 25)" },
  { symbol: "LINK", name: "Chainlink", price: 18.40, change24h: 1.56, color: "oklch(0.72 0.22 240)" },
  { symbol: "UNI", name: "Uniswap", price: 11.20, change24h: -0.78, color: "oklch(0.75 0.28 340)" },
  { symbol: "AAVE", name: "Aave", price: 198.50, change24h: 4.12, color: "oklch(0.72 0.28 305)" },
];

export function PriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>(INITIAL_PRICES);
  const [isPaused, setIsPaused] = useState(false);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        price: p.price * (1 + ((Math.random()) - 0.498) * 0.002),
        change24h: p.change24h + ((Math.random()) - 0.5) * 0.1,
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tickerItems = [...prices, ...prices]; // duplicate for seamless loop

  return (
    <div
      className="w-full overflow-hidden border-b border-white/5 bg-black/40 backdrop-blur-sm"
      style={{ height: "32px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex items-center h-full whitespace-nowrap"
        style={{
          animation: isPaused ? "none" : "ticker-scroll 60s linear infinite",
          display: "flex",
          gap: 0,
        }}
      >
        {tickerItems.map((p, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-4 text-xs font-mono cursor-default select-none"
            style={{ flexShrink: 0 }}
          >
            <span className="font-bold" style={{ color: p.color }}>{p.symbol}</span>
            <span className="text-white/70">${p.price < 1 ? p.price.toFixed(4) : p.price < 100 ? p.price.toFixed(2) : p.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
            <span
              className="inline-flex items-center gap-0.5"
              style={{ color: p.change24h >= 0 ? "oklch(0.80 0.22 145)" : "oklch(0.72 0.25 25)" }}
            >
              {p.change24h >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {Math.abs(p.change24h).toFixed(2)}%
            </span>
            <span className="text-white/20 ml-2">•</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
