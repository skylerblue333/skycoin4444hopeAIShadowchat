import { Link } from "wouter";
import { TrendingUp, Hash, Flame } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function TrendingHashtags() {
  const { data: trends } = trpc.feed.trends.useQuery(undefined, { staleTime: 60_000 });

  const fallback = [
    { hashtag: "#skycoin4444", mentions: 4444 },
    { hashtag: "#defi", mentions: 2891 },
    { hashtag: "#web3", mentions: 2341 },
    { hashtag: "#nft", mentions: 1876 },
    { hashtag: "#crypto", mentions: 1543 },
    { hashtag: "#blockchain", mentions: 1201 },
    { hashtag: "#ai", mentions: 987 },
    { hashtag: "#gamefi", mentions: 743 },
  ];

  const items = (trends && trends.length > 0 ? trends : fallback).slice(0, 8);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Trending Now</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <Link key={i} href={`/search?q=${encodeURIComponent((item as any).hashtag)}`}>
            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                {i < 3 ? (
                  <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                ) : (
                  <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {(item as any).hashtag}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {((item as any).mentions as number).toLocaleString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/search">
        <div className="mt-3 text-xs text-primary hover:underline cursor-pointer text-center">
          View all trends →
        </div>
      </Link>
    </div>
  );
}
