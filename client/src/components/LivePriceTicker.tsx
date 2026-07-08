import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";

export function LivePriceTicker() {
  const { data: prices } = trpc.prices.live.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!prices || prices.length === 0) return null;

  const display = prices.slice(0, 8);

  return (
    <div className="w-full bg-background/95 border-b border-border/30 overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...display, ...display].map((coin, i) => (
          <Link
            key={`${coin.id}-${i}`}
            href={`/crypto?token=${coin.symbol}`}
            className="inline-flex items-center gap-2 px-4 py-1.5 hover:bg-secondary/30 transition-colors shrink-0"
          >
            <span className="text-xs font-bold text-foreground uppercase">{coin.symbol}</span>
            <span className="text-xs font-mono text-foreground">
              ${coin.current_price < 1 ? coin.current_price.toFixed(4) : coin.current_price.toLocaleString()}
            </span>
            <span className={`text-xs flex items-center gap-0.5 ${coin.price_change_percentage_24h >= 0 ? "text-success" : "text-destructive"}`}>
              {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
