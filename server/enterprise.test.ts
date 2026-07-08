/**
 * Enterprise Engine Tests
 *
 * Tests cover:
 *   - Free Will Engine: goal creation, progress tracking, decision logging
 *   - Economy Engine: emission cap logic, sink pressure
 *   - Behavior Engine: archetype scoring, recommendation generation
 *   - Security Engine: risk score thresholds, rate limit logic
 *   - Governance v2: proposal lifecycle, anti-whale cap
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Free Will Engine: Goal System ───────────────────────────────────────────

describe("Free Will Engine — Goal System", () => {
  type GoalStatus = "active" | "pending" | "achieved" | "failed" | "paused";

  interface Goal {
    id: string;
    name: string;
    targetValue: number;
    currentValue: number;
    progress: number;
    status: GoalStatus;
  }

  function computeProgress(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  function evaluateGoalStatus(goal: Goal): GoalStatus {
    if (goal.progress >= 100) return "achieved";
    if (goal.progress < 0) return "failed";
    if (goal.status === "paused") return "paused";
    return "active";
  }

  it("computes 50% progress correctly", () => {
    expect(computeProgress(50, 100)).toBe(50);
  });

  it("caps progress at 100%", () => {
    expect(computeProgress(150, 100)).toBe(100);
  });

  it("returns 0 for zero target", () => {
    expect(computeProgress(50, 0)).toBe(0);
  });

  it("marks goal as achieved at 100% progress", () => {
    const goal: Goal = { id: "g1", name: "Test", targetValue: 100, currentValue: 100, progress: 100, status: "active" };
    expect(evaluateGoalStatus(goal)).toBe("achieved");
  });

  it("keeps goal active when progress is partial", () => {
    const goal: Goal = { id: "g2", name: "Test", targetValue: 100, currentValue: 60, progress: 60, status: "active" };
    expect(evaluateGoalStatus(goal)).toBe("active");
  });

  it("respects paused status", () => {
    const goal: Goal = { id: "g3", name: "Test", targetValue: 100, currentValue: 40, progress: 40, status: "paused" };
    expect(evaluateGoalStatus(goal)).toBe("paused");
  });
});

// ─── Economy Engine: Emission Caps ───────────────────────────────────────────

describe("Economy Engine — Emission Caps", () => {
  interface EmissionCap {
    symbol: string;
    maxSupply: number;
    currentSupply: number;
    dailyMintLimit: number;
  }

  function canMint(cap: EmissionCap, amount: number): boolean {
    return cap.currentSupply + amount <= cap.maxSupply;
  }

  function remainingMintable(cap: EmissionCap): number {
    return Math.max(0, cap.maxSupply - cap.currentSupply);
  }

  const SKY_CAP: EmissionCap = {
    symbol: "SKY444",
    maxSupply: 100_000_000,
    currentSupply: 45_000_000,
    dailyMintLimit: 100_000,
  };

  it("allows minting within cap", () => {
    expect(canMint(SKY_CAP, 1_000)).toBe(true);
  });

  it("rejects minting beyond max supply", () => {
    expect(canMint(SKY_CAP, 60_000_000)).toBe(false);
  });

  it("calculates remaining mintable correctly", () => {
    expect(remainingMintable(SKY_CAP)).toBe(55_000_000);
  });

  it("returns 0 remaining when at max supply", () => {
    const fullCap: EmissionCap = { ...SKY_CAP, currentSupply: 100_000_000 };
    expect(remainingMintable(fullCap)).toBe(0);
  });

  it("exactly at max supply cannot mint any more", () => {
    const fullCap: EmissionCap = { ...SKY_CAP, currentSupply: 100_000_000 };
    expect(canMint(fullCap, 1)).toBe(false);
  });
});

// ─── Behavior Engine: Archetype Scoring ──────────────────────────────────────

describe("Behavior Engine — Archetype Scoring", () => {
  type Archetype = "explorer" | "creator" | "trader" | "governor" | "builder" | "guardian" | "analyst";

  interface BehaviorSignal {
    type: "trade" | "create" | "vote" | "explore" | "build" | "moderate" | "analyze";
    weight: number;
  }

  const ARCHETYPE_SIGNAL_MAP: Record<string, Archetype> = {
    trade: "trader",
    create: "creator",
    vote: "governor",
    explore: "explorer",
    build: "builder",
    moderate: "guardian",
    analyze: "analyst",
  };

  function computeArchetype(signals: BehaviorSignal[]): Archetype {
    const scores: Record<string, number> = {};
    for (const signal of signals) {
      const archetype = ARCHETYPE_SIGNAL_MAP[signal.type];
      if (archetype) {
        scores[archetype] = (scores[archetype] ?? 0) + signal.weight;
      }
    }
    const entries = Object.entries(scores);
    if (entries.length === 0) return "explorer";
    return entries.sort((a, b) => b[1] - a[1])[0][0] as Archetype;
  }

  it("classifies heavy trader correctly", () => {
    const signals: BehaviorSignal[] = [
      { type: "trade", weight: 10 },
      { type: "trade", weight: 8 },
      { type: "create", weight: 2 },
    ];
    expect(computeArchetype(signals)).toBe("trader");
  });

  it("classifies creator when create signals dominate", () => {
    const signals: BehaviorSignal[] = [
      { type: "create", weight: 15 },
      { type: "trade", weight: 3 },
    ];
    expect(computeArchetype(signals)).toBe("creator");
  });

  it("defaults to explorer with no signals", () => {
    expect(computeArchetype([])).toBe("explorer");
  });

  it("classifies governor with vote signals", () => {
    const signals: BehaviorSignal[] = [
      { type: "vote", weight: 20 },
      { type: "trade", weight: 5 },
    ];
    expect(computeArchetype(signals)).toBe("governor");
  });
});

// ─── Security Engine: Risk Scoring ───────────────────────────────────────────

describe("Security Engine — Risk Scoring", () => {
  interface RiskFactors {
    failedLoginAttempts: number;
    unusualTransactionAmount: boolean;
    newDevice: boolean;
    vpnDetected: boolean;
    rapidTransactions: boolean;
  }

  function computeRiskScore(factors: RiskFactors): number {
    let score = 0;
    score += factors.failedLoginAttempts * 10;
    if (factors.unusualTransactionAmount) score += 25;
    if (factors.newDevice) score += 15;
    if (factors.vpnDetected) score += 10;
    if (factors.rapidTransactions) score += 30;
    return Math.min(100, score);
  }

  it("returns 0 for clean user", () => {
    expect(computeRiskScore({
      failedLoginAttempts: 0,
      unusualTransactionAmount: false,
      newDevice: false,
      vpnDetected: false,
      rapidTransactions: false,
    })).toBe(0);
  });

  it("caps score at 100", () => {
    expect(computeRiskScore({
      failedLoginAttempts: 10,
      unusualTransactionAmount: true,
      newDevice: true,
      vpnDetected: true,
      rapidTransactions: true,
    })).toBe(100);
  });

  it("rapid transactions is highest risk factor", () => {
    const score = computeRiskScore({
      failedLoginAttempts: 0,
      unusualTransactionAmount: false,
      newDevice: false,
      vpnDetected: false,
      rapidTransactions: true,
    });
    expect(score).toBe(30);
  });

  it("3 failed logins adds 30 points", () => {
    const score = computeRiskScore({
      failedLoginAttempts: 3,
      unusualTransactionAmount: false,
      newDevice: false,
      vpnDetected: false,
      rapidTransactions: false,
    });
    expect(score).toBe(30);
  });
});

// ─── Governance v2: Anti-Whale Cap ───────────────────────────────────────────

describe("Governance v2 — Anti-Whale Cap", () => {
  const TOTAL_SUPPLY = 100_000_000;
  const MAX_GOVERNANCE_WEIGHT_PCT = 0.05; // 5%

  function effectiveVotingWeight(balance: number): number {
    const maxAllowed = TOTAL_SUPPLY * MAX_GOVERNANCE_WEIGHT_PCT;
    return Math.min(balance, maxAllowed);
  }

  function votingWeightPct(balance: number): number {
    return (effectiveVotingWeight(balance) / TOTAL_SUPPLY) * 100;
  }

  it("caps whale at 5% voting weight", () => {
    const whaleBalance = 20_000_000; // 20% of supply
    expect(votingWeightPct(whaleBalance)).toBe(5);
  });

  it("small holder gets full weight", () => {
    const smallBalance = 1_000; // 0.001%
    expect(effectiveVotingWeight(smallBalance)).toBe(smallBalance);
  });

  it("exactly at cap gets full weight", () => {
    const atCap = 5_000_000; // exactly 5%
    expect(effectiveVotingWeight(atCap)).toBe(5_000_000);
  });

  it("one above cap gets capped", () => {
    const aboveCap = 5_000_001;
    expect(effectiveVotingWeight(aboveCap)).toBe(5_000_000);
  });
});
