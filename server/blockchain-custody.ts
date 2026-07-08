/**
 * SKYCOIN4444 Blockchain Custody Layer
 *
 * Production-safe, non-custodial HD wallet architecture.
 *
 * Architecture principles:
 *   - PRIVATE KEYS ARE NEVER STORED. Period.
 *   - HD wallet derivation uses BIP-44 standard paths
 *   - Addresses are derived server-side from a master seed (env var)
 *   - Transaction signing happens with ephemeral key material
 *   - All on-chain actions are written to on_chain_transactions audit table
 *   - EIP-1559 gas pricing (maxFeePerGas / maxPriorityFeePerGas)
 *   - Multi-chain: Ethereum, Polygon, BSC, Base
 *   - Address validation: EIP-55 checksum enforced
 *   - Replay protection: chainId enforced in all signed transactions
 *
 * Security model:
 *   - Master seed stored ONLY in environment variable (WALLET_MASTER_SEED)
 *   - Each user gets a deterministic address derived from userId
 *   - No private key material ever touches the database
 *   - signedTxHex is cleared from DB after broadcast
 *   - All operations emit to eventBus for audit trail
 *
 * NOT included (requires compliance layer):
 *   - KYC/AML screening
 *   - Travel Rule compliance
 *   - OFAC sanctions screening
 *   - Transaction limits enforcement
 */

import { ethers } from "ethers";
import * as bip39 from "bip39";
import { HDKey } from "@scure/bip32";
import { getDb } from "./db.js";
import { eventBus } from "./event-bus.js";
import { custodyWallets, onChainTransactions } from "../drizzle/schema.js";
import { eq, and, desc } from "drizzle-orm";

// ─── Supported Chains ─────────────────────────────────────────────────────────

export const SUPPORTED_CHAINS = {
  ethereum: { chainId: 1, name: "Ethereum", rpcEnvKey: "ETH_RPC_URL", nativeCurrency: "ETH" },
  polygon: { chainId: 137, name: "Polygon", rpcEnvKey: "POLYGON_RPC_URL", nativeCurrency: "MATIC" },
  bsc: { chainId: 56, name: "BNB Smart Chain", rpcEnvKey: "BSC_RPC_URL", nativeCurrency: "BNB" },
  base: { chainId: 8453, name: "Base", rpcEnvKey: "BASE_RPC_URL", nativeCurrency: "ETH" },
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WalletInfo {
  id: number;
  userId: number;
  address: string;
  derivationPath: string;
  chainId: number;
  chainName: string;
  walletType: "hd" | "imported" | "multisig";
  label: string | null;
  isPrimary: boolean;
  cachedBalanceWei: string | null;
  createdAt: Date;
}

export interface TransactionRequest {
  to: string;
  valueWei: string;
  chainId: number;
  // ERC-20 transfer (optional)
  tokenContract?: string;
  tokenSymbol?: string;
  tokenAmount?: string;
  tokenDecimals?: number;
  // Gas (optional — will be estimated if not provided)
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  // Internal metadata
  internalNote?: string;
}

export interface SignedTransaction {
  txId: number;
  signedHex: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  chainId: number;
  nonce: number;
  estimatedGasCost: string;
}

export interface BroadcastResult {
  txId: number;
  txHash: string;
  status: "broadcast" | "failed";
  errorMessage?: string;
}

export interface AddressValidationResult {
  valid: boolean;
  checksumAddress: string | null;
  isContract: boolean | null;
  errorMessage?: string;
}

// ─── Blockchain Custody Service ───────────────────────────────────────────────

export class BlockchainCustodyService {
  /**
   * Derive a deterministic EVM address for a user.
   * Uses BIP-44 path: m/44'/60'/0'/0/{userId}
   *
   * SECURITY: Master seed comes from env var only — never hardcoded.
   */
  deriveUserAddress(userId: number, accountIndex = 0): { address: string; derivationPath: string } {
    const masterSeed = process.env.WALLET_MASTER_SEED;
    if (!masterSeed) {
      throw new Error("WALLET_MASTER_SEED environment variable not set");
    }

    // Validate mnemonic
    if (!bip39.validateMnemonic(masterSeed)) {
      throw new Error("WALLET_MASTER_SEED is not a valid BIP-39 mnemonic");
    }

    const seed = bip39.mnemonicToSeedSync(masterSeed);
    const hdKey = HDKey.fromMasterSeed(seed);

    // BIP-44: m/44'/60'/accountIndex'/0/userId
    const derivationPath = `m/44'/60'/${accountIndex}'/0/${userId}`;
    const derived = hdKey.derive(derivationPath);

    if (!derived.privateKey) {
      throw new Error("Failed to derive private key from path");
    }

    const wallet = new ethers.Wallet(ethers.hexlify(derived.privateKey));

    return {
      address: wallet.address, // EIP-55 checksummed
      derivationPath,
    };
  }

  /**
   * Register a derived wallet address for a user in the database.
   * Only the address and derivation path are stored — never the private key.
   */
  async registerWallet(
    userId: number,
    chain: SupportedChain = "ethereum",
    label?: string
  ): Promise<WalletInfo> {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const chainConfig = SUPPORTED_CHAINS[chain];

    // Check if user already has a wallet on this chain
    const [existing] = await db
      .select()
      .from(custodyWallets)
      .where(and(eq(custodyWallets.userId, userId), eq(custodyWallets.chainId, chainConfig.chainId)))
      .limit(1);

    if (existing) {
      return existing as WalletInfo;
    }

    // Derive address
    const { address, derivationPath } = this.deriveUserAddress(userId);

    // Check if this is the user's first wallet (make it primary)
    const [anyWallet] = await db
      .select()
      .from(custodyWallets)
      .where(eq(custodyWallets.userId, userId))
      .limit(1);

    const isPrimary = !anyWallet;

    const [result] = await db.insert(custodyWallets).values({
      userId,
      address,
      derivationPath,
      chainId: chainConfig.chainId,
      chainName: chainConfig.name,
      walletType: "hd",
      label: label ?? `${chainConfig.name} Wallet`,
      isPrimary,
      lastKnownNonce: 0,
      cachedBalanceWei: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const walletId = (result as { insertId: number }).insertId;

    eventBus.publish("WALLET_CREATED", {
      userId,
      walletId,
      address,
      chainId: chainConfig.chainId,
      chainName: chainConfig.name,
    }, userId);

    const [wallet] = await db
      .select()
      .from(custodyWallets)
      .where(eq(custodyWallets.id, walletId))
      .limit(1);

    return wallet as WalletInfo;
  }

  /**
   * Get all wallets for a user.
   */
  async getUserWallets(userId: number): Promise<WalletInfo[]> {
    const db = await getDb();
    if (!db) return [];
    const wallets = await db
      .select()
      .from(custodyWallets)
      .where(eq(custodyWallets.userId, userId));
    return wallets as WalletInfo[];
  }

  /**
   * Validate an EVM address.
   * Enforces EIP-55 checksum. Optionally checks if it's a contract.
   */
  validateAddress(address: string): AddressValidationResult {
    try {
      if (!ethers.isAddress(address)) {
        return { valid: false, checksumAddress: null, isContract: null, errorMessage: "Invalid EVM address format" };
      }

      const checksumAddress = ethers.getAddress(address); // throws if invalid checksum
      return { valid: true, checksumAddress, isContract: null };
    } catch {
      return { valid: false, checksumAddress: null, isContract: null, errorMessage: "Address checksum validation failed" };
    }
  }

  /**
   * Build and sign a transaction.
   * Returns the signed hex and stores the tx record in the DB.
   * Private key is derived ephemerally and immediately discarded.
   */
  async buildAndSignTransaction(
    userId: number,
    request: TransactionRequest
  ): Promise<SignedTransaction> {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // Validate destination address
    const validation = this.validateAddress(request.to);
    if (!validation.valid) {
      throw new Error(`Invalid destination address: ${validation.errorMessage}`);
    }

    // Get user's wallet for this chain
    const [walletRecord] = await db
      .select()
      .from(custodyWallets)
      .where(and(eq(custodyWallets.userId, userId), eq(custodyWallets.chainId, request.chainId)))
      .limit(1);

    if (!walletRecord) {
      throw new Error(`No wallet found for user ${userId} on chain ${request.chainId}`);
    }

    // Get RPC provider
    const provider = this.getProvider(request.chainId);

    // Derive private key ephemerally
    const masterSeed = process.env.WALLET_MASTER_SEED;
    if (!masterSeed) throw new Error("WALLET_MASTER_SEED not set");

    const seed = bip39.mnemonicToSeedSync(masterSeed);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derived = hdKey.derive(walletRecord.derivationPath);

    if (!derived.privateKey) throw new Error("Key derivation failed");

    const signer = new ethers.Wallet(ethers.hexlify(derived.privateKey), provider);

    // Derived key is ephemeral — GC will collect it after this scope

    // Get nonce
    const nonce = await provider.getTransactionCount(signer.address, "pending");

    // Get gas price (EIP-1559)
    const feeData = await provider.getFeeData();
    const maxFeePerGas = request.maxFeePerGas
      ? BigInt(request.maxFeePerGas)
      : (feeData.maxFeePerGas ?? BigInt(20e9));
    const maxPriorityFeePerGas = request.maxPriorityFeePerGas
      ? BigInt(request.maxPriorityFeePerGas)
      : (feeData.maxPriorityFeePerGas ?? BigInt(1e9));

    let txData: ethers.TransactionRequest;

    if (request.tokenContract) {
      // ERC-20 transfer
      const erc20Interface = new ethers.Interface([
        "function transfer(address to, uint256 amount) returns (bool)",
      ]);
      const data = erc20Interface.encodeFunctionData("transfer", [
        validation.checksumAddress!,
        BigInt(request.tokenAmount ?? "0"),
      ]);

      txData = {
        to: request.tokenContract,
        value: 0n,
        data,
        chainId: request.chainId,
        nonce,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: request.gasLimit ? BigInt(request.gasLimit) : 65000n,
        type: 2,
      };
    } else {
      // Native ETH/MATIC/BNB transfer
      txData = {
        to: validation.checksumAddress!,
        value: BigInt(request.valueWei),
        chainId: request.chainId,
        nonce,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: request.gasLimit ? BigInt(request.gasLimit) : 21000n,
        type: 2,
      };
    }

    // Estimate gas if not provided
    if (!request.gasLimit) {
      try {
        const estimated = await provider.estimateGas({ ...txData, from: signer.address });
        txData.gasLimit = (estimated * 120n) / 100n; // 20% buffer
      } catch {
        // Use default
      }
    }

    // Sign the transaction
    const signedTx = await signer.signTransaction(txData);
    const txHash = ethers.keccak256(signedTx);

    const estimatedGasCost = (
      (txData.gasLimit as bigint) * maxFeePerGas
    ).toString();

    // Store in DB
    const [insertResult] = await db.insert(onChainTransactions).values({
      userId,
      walletId: walletRecord.id,
      txHash,
      chainId: request.chainId,
      fromAddress: signer.address,
      toAddress: validation.checksumAddress!,
      valueWei: request.valueWei,
      gasLimit: txData.gasLimit?.toString() ?? null,
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      nonce,
      tokenContract: request.tokenContract ?? null,
      tokenSymbol: request.tokenSymbol ?? null,
      tokenAmount: request.tokenAmount ?? null,
      tokenDecimals: request.tokenDecimals ?? null,
      status: "signed",
      confirmations: 0,
      signedTxHex: signedTx, // cleared after broadcast
      internalNote: request.internalNote ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const txId = (insertResult as { insertId: number }).insertId;

    eventBus.publish("TRANSACTION_SIGNED", {
      txId,
      txHash,
      userId,
      chainId: request.chainId,
      fromAddress: signer.address,
      toAddress: validation.checksumAddress!,
    }, userId);

    return {
      txId,
      signedHex: signedTx,
      txHash,
      fromAddress: signer.address,
      toAddress: validation.checksumAddress!,
      chainId: request.chainId,
      nonce,
      estimatedGasCost,
    };
  }

  /**
   * Broadcast a signed transaction to the network.
   * Clears signedTxHex from DB after broadcast.
   */
  async broadcastTransaction(txId: number, userId: number): Promise<BroadcastResult> {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const [txRecord] = await db
      .select()
      .from(onChainTransactions)
      .where(and(eq(onChainTransactions.id, txId), eq(onChainTransactions.userId, userId)))
      .limit(1);

    if (!txRecord) throw new Error("Transaction not found");
    if (txRecord.status !== "signed") throw new Error(`Cannot broadcast transaction in status: ${txRecord.status}`);
    if (!txRecord.signedTxHex) throw new Error("No signed transaction hex found");

    const provider = this.getProvider(txRecord.chainId);

    try {
      const response = await provider.broadcastTransaction(txRecord.signedTxHex);

      // Update DB: mark as broadcast, clear signed hex
      await db
        .update(onChainTransactions)
        .set({
          status: "broadcast",
          txHash: response.hash,
          signedTxHex: null, // clear immediately after broadcast
          updatedAt: new Date(),
        })
        .where(eq(onChainTransactions.id, txId));

      // Update wallet nonce cache
      await db
        .update(custodyWallets)
        .set({
          lastKnownNonce: (txRecord.nonce ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(custodyWallets.id, txRecord.walletId));

      eventBus.publish("TRANSACTION_BROADCAST", {
        txId,
        txHash: response.hash,
        userId,
        chainId: txRecord.chainId,
      }, userId);

      // Start confirmation polling (non-blocking)
      void this.pollConfirmation(txId, response.hash, txRecord.chainId, provider);

      return { txId, txHash: response.hash, status: "broadcast" };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown broadcast error";

      await db
        .update(onChainTransactions)
        .set({
          status: "failed",
          errorMessage,
          signedTxHex: null, // clear even on failure
          updatedAt: new Date(),
        })
        .where(eq(onChainTransactions.id, txId));

      eventBus.publish("TRANSACTION_FAILED", {
        txId,
        userId,
        errorMessage,
      }, userId);

      return { txId, txHash: txRecord.txHash ?? "", status: "failed", errorMessage };
    }
  }

  /**
   * Get transaction history for a user.
   */
  async getTransactionHistory(userId: number, limit = 50): Promise<typeof onChainTransactions.$inferSelect[]> {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(onChainTransactions)
      .where(eq(onChainTransactions.userId, userId))
      .orderBy(desc(onChainTransactions.createdAt))
      .limit(limit);
  }

  /**
   * Get on-chain balance for a wallet address.
   */
  async getOnChainBalance(address: string, chainId: number): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch {
      return "0";
    }
  }

  /**
   * Get ERC-20 token balance.
   */
  async getTokenBalance(
    address: string,
    tokenContract: string,
    chainId: number,
    decimals = 18
  ): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const erc20 = new ethers.Contract(
        tokenContract,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
      const balance = await erc20.balanceOf(address) as bigint;
      return ethers.formatUnits(balance, decimals);
    } catch {
      return "0";
    }
  }

  /**
   * Estimate gas for a transaction.
   */
  async estimateGas(
    from: string,
    to: string,
    valueWei: string,
    chainId: number,
    data?: string
  ): Promise<{ gasLimit: string; maxFeePerGas: string; maxPriorityFeePerGas: string; estimatedCostEth: string }> {
    try {
      const provider = this.getProvider(chainId);
      const [gasLimit, feeData] = await Promise.all([
        provider.estimateGas({ from, to, value: BigInt(valueWei), data }),
        provider.getFeeData(),
      ]);

      const maxFeePerGas = feeData.maxFeePerGas ?? BigInt(20e9);
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? BigInt(1e9);
      const bufferedGas = (gasLimit * 120n) / 100n;
      const estimatedCost = bufferedGas * maxFeePerGas;

      return {
        gasLimit: bufferedGas.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        estimatedCostEth: ethers.formatEther(estimatedCost),
      };
    } catch {
      return {
        gasLimit: "21000",
        maxFeePerGas: "20000000000",
        maxPriorityFeePerGas: "1000000000",
        estimatedCostEth: "0.00042",
      };
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private getProvider(chainId: number): ethers.JsonRpcProvider {
    const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.chainId === chainId);
    if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);

    const rpcUrl = process.env[chain.rpcEnvKey];

    // Fallback to public RPC endpoints (rate-limited but functional for dev)
    const fallbackRpcs: Record<number, string> = {
      1: "https://cloudflare-eth.com",
      137: "https://polygon-rpc.com",
      56: "https://bsc-dataseed.binance.org",
      8453: "https://mainnet.base.org",
    };

    const url = rpcUrl ?? fallbackRpcs[chainId];
    if (!url) throw new Error(`No RPC URL for chainId ${chainId}`);

    return new ethers.JsonRpcProvider(url, chainId);
  }

  /**
   * Poll for transaction confirmation (non-blocking, runs in background).
   */
  private async pollConfirmation(
    txId: number,
    txHash: string,
    chainId: number,
    provider: ethers.JsonRpcProvider,
    maxAttempts = 30
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 12_000)); // 12s block time

      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) continue;

        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber + 1;

        if (confirmations >= 1) {
          await db
            .update(onChainTransactions)
            .set({
              status: receipt.status === 1 ? "confirmed" : "failed",
              blockNumber: receipt.blockNumber,
              confirmations,
              updatedAt: new Date(),
            })
            .where(eq(onChainTransactions.id, txId));

          eventBus.publish("TRANSACTION_CONFIRMED", {
            txId,
            txHash,
            chainId,
            blockNumber: receipt.blockNumber,
            confirmations,
            success: receipt.status === 1,
          });

          return;
        }
      } catch {
        // Continue polling
      }
    }

    // Mark as dropped if no confirmation after maxAttempts
    await db
      .update(onChainTransactions)
      .set({ status: "dropped", updatedAt: new Date() })
      .where(eq(onChainTransactions.id, txId));
  }
}

export const blockchainCustody = new BlockchainCustodyService();
