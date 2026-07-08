import { Router } from 'express';
import { walletManager } from './secure-wallet';
import { baseSwapEngine } from './base-swap-engine';

const router = Router();

/**
 * GET /api/mining/wallet/balance
 * Get wallet balances
 */
router.get('/wallet/balance', (req, res) => {
  try {
    const stats = walletManager.getStatistics();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/wallet/transactions
 * Get wallet transaction history
 */
router.get('/wallet/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await walletManager.getTransactionHistory(process.env.ADMIN_WALLET_ADDRESS || '0x', limit);

    res.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/mining/wallet/swap-quote
 * Get swap quote
 */
router.post('/wallet/swap-quote', async (req, res) => {
  try {
    const { inputCoin, outputCoin, inputAmount } = req.body;

    if (!inputCoin || !outputCoin || !inputAmount) {
      return res.status(400).json({
        success: false,
        error: 'inputCoin, outputCoin, and inputAmount are required',
      });
    }

    const quote = await baseSwapEngine.getSwapQuote(inputCoin, outputCoin, inputAmount);

    res.json({
      success: true,
      quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/mining/wallet/swap
 * Execute swap
 */
router.post('/wallet/swap', async (req, res) => {
  try {
    const { inputCoin, outputCoin, inputAmount, fromAddress, toAddress } = req.body;

    if (!inputCoin || !outputCoin || !inputAmount || !fromAddress || !toAddress) {
      return res.status(400).json({
        success: false,
        error: 'All parameters are required',
      });
    }

    const swap = await baseSwapEngine.executeSwap(inputCoin, outputCoin, inputAmount, fromAddress, toAddress);

    res.json({
      success: true,
      swap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/mining/wallet/swap-and-deposit
 * Swap all mined coins and deposit to wallet
 */
router.post('/wallet/swap-and-deposit', async (req, res) => {
  try {
    const { minedCoins, fromAddress, toWalletAddress } = req.body;

    if (!minedCoins || !fromAddress || !toWalletAddress) {
      return res.status(400).json({
        success: false,
        error: 'minedCoins, fromAddress, and toWalletAddress are required',
      });
    }

    const swaps = await baseSwapEngine.swapAndDepositToWallet(minedCoins, fromAddress, toWalletAddress);

    res.json({
      success: true,
      swaps,
      count: swaps.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/wallet/swap-history
 * Get swap history
 */
router.get('/wallet/swap-history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const swaps = baseSwapEngine.getSwapHistory(limit);

    res.json({
      success: true,
      swaps,
      count: swaps.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/wallet/swap-stats
 * Get swap statistics
 */
router.get('/wallet/swap-stats', (req, res) => {
  try {
    const stats = baseSwapEngine.getSwapStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/wallet/prices
 * Get current prices for all coins
 */
router.get('/wallet/prices', async (req, res) => {
  try {
    const prices = await baseSwapEngine.getAllPrices();

    res.json({
      success: true,
      prices,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/mining/wallet/route-mining-reward
 * Route mining reward to admin wallet
 */
router.post('/wallet/route-mining-reward', async (req, res) => {
  try {
    const { sessionId, amount, currency } = req.body;

    if (!sessionId || !amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, amount, and currency are required',
      });
    }

    const transaction = await walletManager.routeMiningRewards(sessionId, amount, currency);

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
