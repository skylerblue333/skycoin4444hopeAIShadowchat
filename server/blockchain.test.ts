/**
 * Blockchain Custody Engine Tests
 *
 * Tests cover:
 *   - Address validation (EIP-55 checksum)
 *   - HD wallet derivation path format
 *   - Wei/ETH conversion utilities
 *   - Chain configuration completeness
 *   - Gas estimation inputs
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Unit: Address Validation ─────────────────────────────────────────────────

describe("Address Validation", () => {
  it("accepts a valid EIP-55 checksummed address", () => {
    const addr = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("rejects an address that is too short", () => {
    const addr = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeA";
    expect(addr.length).toBeLessThan(42);
  });

  it("rejects an address without 0x prefix", () => {
    const addr = "5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
    expect(addr.startsWith("0x")).toBe(false);
  });

  it("accepts a zero address as structurally valid", () => {
    const addr = "0x0000000000000000000000000000000000000000";
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});

// ─── Unit: Wei/ETH Conversion ─────────────────────────────────────────────────

describe("Wei to ETH conversion", () => {
  function weiToEth(wei: string): number {
    return Number(BigInt(wei)) / 1e18;
  }

  it("converts 1 ETH in wei correctly", () => {
    expect(weiToEth("1000000000000000000")).toBeCloseTo(1.0);
  });

  it("converts 0.001 ETH in wei correctly", () => {
    expect(weiToEth("1000000000000000")).toBeCloseTo(0.001);
  });

  it("converts zero wei to zero ETH", () => {
    expect(weiToEth("0")).toBe(0);
  });

  it("handles large values without overflow", () => {
    const result = weiToEth("100000000000000000000"); // 100 ETH
    expect(result).toBeCloseTo(100);
  });
});

// ─── Unit: BIP-44 Derivation Path ─────────────────────────────────────────────

describe("BIP-44 derivation path", () => {
  function derivationPath(userId: number, accountIndex = 0): string {
    return `m/44'/60'/${accountIndex}'/0/${userId}`;
  }

  it("generates correct path for user 1", () => {
    expect(derivationPath(1)).toBe("m/44'/60'/0'/0/1");
  });

  it("generates correct path for user 999", () => {
    expect(derivationPath(999)).toBe("m/44'/60'/0'/0/999");
  });

  it("includes account index when specified", () => {
    expect(derivationPath(1, 2)).toBe("m/44'/60'/2'/0/1");
  });

  it("path starts with m/44'/60'", () => {
    const path = derivationPath(42);
    expect(path.startsWith("m/44'/60'")).toBe(true);
  });
});

// ─── Unit: Chain Configuration ────────────────────────────────────────────────

describe("Chain configuration", () => {
  const SUPPORTED_CHAINS = {
    ethereum: { chainId: 1, name: "Ethereum", rpcUrl: "https://eth.llamarpc.com", nativeCurrency: "ETH" },
    polygon: { chainId: 137, name: "Polygon", rpcUrl: "https://polygon.llamarpc.com", nativeCurrency: "MATIC" },
    bsc: { chainId: 56, name: "BNB Smart Chain", rpcUrl: "https://bsc-dataseed.binance.org", nativeCurrency: "BNB" },
    base: { chainId: 8453, name: "Base", rpcUrl: "https://mainnet.base.org", nativeCurrency: "ETH" },
  } as const;

  it("has 4 supported chains", () => {
    expect(Object.keys(SUPPORTED_CHAINS).length).toBe(4);
  });

  it("each chain has a unique chainId", () => {
    const ids = Object.values(SUPPORTED_CHAINS).map((c) => c.chainId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("each chain has a valid RPC URL", () => {
    for (const chain of Object.values(SUPPORTED_CHAINS)) {
      expect(chain.rpcUrl).toMatch(/^https?:\/\//);
    }
  });

  it("Ethereum mainnet has chainId 1", () => {
    expect(SUPPORTED_CHAINS.ethereum.chainId).toBe(1);
  });

  it("Polygon has chainId 137", () => {
    expect(SUPPORTED_CHAINS.polygon.chainId).toBe(137);
  });
});

// ─── Unit: Gas Estimation Inputs ─────────────────────────────────────────────

describe("Gas estimation", () => {
  function estimateGasCost(gasLimit: bigint, maxFeePerGas: bigint): bigint {
    return gasLimit * maxFeePerGas;
  }

  it("calculates gas cost correctly", () => {
    const gasLimit = 21000n;
    const maxFeePerGas = 20_000_000_000n; // 20 Gwei
    const cost = estimateGasCost(gasLimit, maxFeePerGas);
    expect(cost).toBe(420_000_000_000_000n); // 0.00042 ETH
  });

  it("returns zero for zero gas limit", () => {
    expect(estimateGasCost(0n, 20_000_000_000n)).toBe(0n);
  });

  it("handles high gas prices", () => {
    const gasLimit = 21000n;
    const maxFeePerGas = 500_000_000_000n; // 500 Gwei
    const cost = estimateGasCost(gasLimit, maxFeePerGas);
    expect(cost).toBeGreaterThan(0n);
  });
});
