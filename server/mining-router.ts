import { Router } from 'express';
import { advancedMiningEngine } from './advanced-mining-engine';
import { coinbaseIntegration } from './coinbase-integration';
import { notifyOwner } from './_core/notification';

const router = Router();

/**
 * GET /api/mining/status
 * Get current mining status
 */
router.get('/status', (req, res) => {
  try {
    const status = advancedMiningEngine.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/stats
 * Get mining statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = advancedMiningEngine.getStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/sessions
 * Get mining session history
 */
router.get('/sessions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const sessions = advancedMiningEngine.getSessions(limit);
    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/pools
 * Get all mining pools
 */
router.get('/pools', (req, res) => {
  try {
    const pools = advancedMiningEngine.getPools();
    res.json({
      success: true,
      data: {
        pools,
        count: pools.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/mining/workers
 * Get all active workers
 */
router.get('/workers', (req, res) => {
  try {
    const workers = advancedMiningEngine.getWorkers();
    res.json({
      success: true,
      data: {
        workers,
        count: workers.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/mining/start
 * Start mining
 */
router.post('/start', async (req, res) => {
  try {
    await advancedMiningEngine.startMining();
    res.json({
      success: true,
      message: 'Mining started successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/mining/stop
 * Stop mining
 */
router.post('/stop', async (req, res) => {
  try {
    await advancedMiningEngine.stopMining();
    res.json({
      success: true,
      message: 'Mining stopped successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/coinbase/balance
 * Get Coinbase account balance
 */
router.get('/coinbase/balance', async (req, res) => {
  try {
    const balance = await coinbaseIntegration.getAccountBalance();
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/coinbase/sell
 * Sell crypto for USD
 */
router.post('/coinbase/sell', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'amount and currency are required',
      });
    }

    const result = await coinbaseIntegration.sellCrypto(amount, currency);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/coinbase/withdraw
 * Withdraw USD to bank account
 */
router.post('/coinbase/withdraw', async (req, res) => {
  try {
    const { amount, bankAccountId } = req.body;

    if (!amount || !bankAccountId) {
      return res.status(400).json({
        success: false,
        error: 'amount and bankAccountId are required',
      });
    }

    const withdrawal = await coinbaseIntegration.withdrawToBank(amount, bankAccountId);

    res.json({
      success: withdrawal.status !== 'failed',
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/coinbase/withdrawals
 * Get withdrawal history
 */
router.get('/coinbase/withdrawals', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const withdrawals = coinbaseIntegration.getWithdrawalHistory(limit);
    const totalWithdrawn = coinbaseIntegration.getTotalWithdrawn();

    res.json({
      success: true,
      data: {
        withdrawals,
        count: withdrawals.length,
        totalWithdrawn,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/mining/test-notification
 * Test notification system
 */
router.post('/test-notification', async (req, res) => {
  try {
    await notifyOwner({
      title: '🧪 Test Notification',
      content: 'This is a test notification from the mining system. All systems are operational!',
    });

    res.json({
      success: true,
      message: 'Test notification sent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
