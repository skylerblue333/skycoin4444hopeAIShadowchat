/**
 * SKYCOIN4444 Blockchain tRPC Router
 *
 * Exposes the blockchain custody layer via tRPC:
 *   - Wallet registration (derive + register address)
 *   - Address validation
 *   - Gas estimation
 *   - Transaction building + signing
 *   - Transaction broadcasting
 *   - Transaction history
 *   - On-chain balance queries
 *
 * Security:
 *   - All procedures require authentication
 *   - Users can only access their own wallets/transactions
 *   - Admin can view all transactions for audit
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc.js";
import { blockchainCustody, SUPPORTED_CHAINS } from "./blockchain-custody.js";

const CHAIN_IDS = Object.values(SUPPORTED_CHAINS).map((c) => c.chainId);

export const blockchainRouter = router({
  /**
   * Get all supported chains.
   */
  supportedChains: protectedProcedure.query(() => {
    return Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => ({
      key,
      chainId: chain.chainId,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
    }));
  }),

  /**
   * Register a wallet for the current user on a given chain.
   * Derives address from HD wallet — no private key stored.
   */
  registerWallet: protectedProcedure
    .input(
      z.object({
        chain: z.enum(["ethereum", "polygon", "bsc", "base"]).default("ethereum"),
        label: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return blockchainCustody.registerWallet(ctx.user.id, input.chain, input.label);
    }),

  /**
   * Get all wallets for the current user.
   */
  myWallets: protectedProcedure.query(async ({ ctx }) => {
    return blockchainCustody.getUserWallets(ctx.user.id);
  }),

  /**
   * Validate an EVM address (EIP-55 checksum).
   */
  validateAddress: protectedProcedure
    .input(z.object({ address: z.string().min(1) }))
    .query(({ input }) => {
      return blockchainCustody.validateAddress(input.address);
    }),

  /**
   * Estimate gas for a transaction.
   */
  estimateGas: protectedProcedure
    .input(
      z.object({
        from: z.string().min(42).max(42),
        to: z.string().min(42).max(42),
        valueWei: z.string().default("0"),
        chainId: z.number().int(), // validated in service
        data: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return blockchainCustody.estimateGas(
        input.from,
        input.to,
        input.valueWei,
        input.chainId,
        input.data
      );
    }),

  /**
   * Build and sign a transaction.
   * Returns signedHex + txId for broadcasting.
   */
  buildAndSign: protectedProcedure
    .input(
      z.object({
        to: z.string().min(42).max(42),
        valueWei: z.string().default("0"),
        chainId: z.number().int(), // validated in service
        tokenContract: z.string().min(42).max(42).optional(),
        tokenSymbol: z.string().max(20).optional(),
        tokenAmount: z.string().optional(),
        tokenDecimals: z.number().int().min(0).max(18).optional(),
        gasLimit: z.string().optional(),
        maxFeePerGas: z.string().optional(),
        maxPriorityFeePerGas: z.string().optional(),
        internalNote: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return blockchainCustody.buildAndSignTransaction(ctx.user.id, input);
    }),

  /**
   * Broadcast a previously signed transaction.
   */
  broadcast: protectedProcedure
    .input(z.object({ txId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return blockchainCustody.broadcastTransaction(input.txId, ctx.user.id);
    }),

  /**
   * Get transaction history for the current user.
   */
  myTransactions: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).optional() }))
    .query(async ({ ctx, input }) => {
      const txs = await blockchainCustody.getTransactionHistory(ctx.user.id, input.limit ?? 50);
      // Never expose signedTxHex to client
      return txs.map(({ signedTxHex: _stripped, ...tx }) => tx);
    }),

  /**
   * Get on-chain native balance for a wallet address.
   */
  onChainBalance: protectedProcedure
    .input(
      z.object({
        address: z.string().min(42).max(42),
        chainId: z.number().int(), // validated in service
      })
    )
    .query(async ({ input }) => {
      const balance = await blockchainCustody.getOnChainBalance(input.address, input.chainId);
      return { address: input.address, chainId: input.chainId, balance, unit: "ETH" };
    }),

  /**
   * Get ERC-20 token balance.
   */
  tokenBalance: protectedProcedure
    .input(
      z.object({
        address: z.string().min(42).max(42),
        tokenContract: z.string().min(42).max(42),
        chainId: z.number().int(), // validated in service
        decimals: z.number().int().min(0).max(18).optional(),
      })
    )
    .query(async ({ input }) => {
      const balance = await blockchainCustody.getTokenBalance(
        input.address,
        input.tokenContract,
        input.chainId,
        input.decimals ?? 18
      );
      return { address: input.address, tokenContract: input.tokenContract, balance };
    }),

  /**
   * Admin: view all on-chain transactions for audit.
   */
  adminAllTransactions: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
    )
    .query(async ({ input }) => {
      const txs = await blockchainCustody.getTransactionHistory(
        input.userId ?? 0,
        input.limit ?? 100
      );
      return txs.map(({ signedTxHex: _stripped, ...tx }) => tx);
    }),
});
