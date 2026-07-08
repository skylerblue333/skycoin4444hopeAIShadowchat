/**
 * WorldContext — Shared World State Provider
 *
 * Provides the global world state to every module:
 * - Simulation entities (AI personas)
 * - Live feed items
 * - Trending topics
 * - Market signals
 * - Wallet balance
 * - World tick counter
 *
 * Core services (feed, chat, wallet) work WITHOUT AI.
 * AI enhances but never blocks.
 */
import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import type { SimEntity, FeedItem, TrendSignal, MarketSignal } from "../../../server/simulationEngine";

interface WorldState {
  // Simulation
  tick: number;
  entities: SimEntity[];
  feedItems: FeedItem[];
  trends: TrendSignal[];
  marketSignals: MarketSignal[];
  isLoading: boolean;

  // Actions
  refetch: () => void;
  triggerTick: () => void;
  isTickPending: boolean;
}

const WorldContext = createContext<WorldState | null>(null);

export function WorldProvider({ children }: { children: ReactNode }) {
  const worldState = trpc.simulation.getWorldState.useQuery(undefined, {
    refetchInterval: 10_000, // poll every 10s — rule-based, no AI cost
    staleTime: 5_000,
  });

  const tickMutation = trpc.simulation.tick.useMutation({
    onSuccess: () => worldState.refetch(),
  });

  const data = worldState.data;

  const value: WorldState = {
    tick: data?.tick ?? 0,
    entities: (data?.entities ?? []) as SimEntity[],
    feedItems: (data?.feedItems ?? []) as FeedItem[],
    trends: (data?.trends ?? []) as TrendSignal[],
    marketSignals: (data?.marketSignals ?? []) as MarketSignal[],
    isLoading: worldState.isLoading,
    refetch: () => worldState.refetch(),
    triggerTick: () => tickMutation.mutate(),
    isTickPending: tickMutation.isPending,
  };

  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld(): WorldState {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error("useWorld must be used within WorldProvider");
  return ctx;
}
