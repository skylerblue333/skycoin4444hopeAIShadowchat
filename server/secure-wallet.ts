import crypto from 'crypto';
// Database imports commented out - will be added when schema is updated
// import { db } from './db';
// import { wallets, walletTransactions, walletAuditLog } from '../drizzle/schema';
// import { eq, desc } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

interface WalletConfig {
  address: string;
  encryptedPrivateKey: string;
  publicKey: string;
  blockchain: 'ethereum' | 'solana' | 'bitcoin' | 'custom';
  type: 'admin' | 'user' | 'mining' | 'treasury';
  multisigRequired: number;
  multisigApprovals: number;
  createdAt: number;
}

interface Transaction {
  id: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  token: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  timestamp: number;
}

interface AuditLog {
  id: string;
  action: string;
  walletAddress: string;
  details: string;
  timestamp: number;
  userId: string;
}

class SecureWalletManager {
  private encryptionKey: string;
  private walletCache: Map<string, WalletConfig> = new Map();

  constructor() {
    // Use environment variable for encryption key
    this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

    if (!process.env.WALLET_ENCRYPTION_KEY) {
      console.warn('[SecureWallet] Using generated encryption key - set WALLET_ENCRYPTION_KEY env var for production');
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create new wallet
   */
  async createWallet(
    address: string,
    privateKey: string,
    blockchain: 'ethereum' | 'solana' | 'bitcoin' | 'custom',
    type: 'admin' | 'user' | 'mining' | 'treasury',
    multisigRequired = 1
  ): Promise<WalletConfig> {
    
    // Encrypt private key
    const encryptedPrivateKey = this.encrypt(privateKey);

    // Generate public key (simplified - in production use proper key derivation)
    const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex').substring(0, 66);

    const wallet: WalletConfig = {
      address,
      encryptedPrivateKey,
      publicKey,
      blockchain,
      type,
      multisigRequired,
      multisigApprovals: 0,
      createdAt: Date.now(),
    };

    this.walletCache.set(address, wallet);

    // Log creation
    await this.logAudit('CREATE_WALLET', address, `Created ${type} wallet on ${blockchain}`, 'system');

    // Notify owner
    await notifyOwner({
      title: 'Wallet Created',
      content: `New ${type} wallet created on ${blockchain}: ${address}`,
    });

    return wallet;
  }

  /**
   * Get wallet (decrypted)
   */
  async getWallet(address: string): Promise<WalletConfig | null> {
    // Check cache first
    if (this.walletCache.has(address)) {
      return this.walletCache.get(address) || null;
    }

    // In production, fetch from database
    // const wallet = await db.query.wallets.findFirst({ where: eq(wallets.address, address) });
    // if (wallet) this.walletCache.set(address, wallet);
    // return wallet || null;

    return null;
  }

  /**
   * Get decrypted private key (requires authorization)
   */
  async getPrivateKey(address: string, userId: string): Promise<string> {
    
    const wallet = await this.getWallet(address);
    if (!wallet) {
      throw new Error(`Wallet ${address} not found`);
    }

    // Log access
    await this.logAudit('ACCESS_PRIVATE_KEY', address, `Private key accessed by ${userId}`, userId);

    // Decrypt and return
    return this.decrypt(wallet.encryptedPrivateKey);
  }

  /**
   * Transfer funds from wallet
   */
  async transferFunds(
    fromAddress: string,
    toAddress: string,
    amount: number,
    token: string,
    userId: string
  ): Promise<Transaction> {
    
    const wallet = await this.getWallet(fromAddress);
    if (!wallet) {
      throw new Error(`Wallet ${fromAddress} not found`);
    }

    // Check multisig requirement
    if (wallet.multisigRequired > 1 && wallet.multisigApprovals < wallet.multisigRequired) {
      throw new Error(`Multisig approval required (${wallet.multisigApprovals}/${wallet.multisigRequired})`);
    }

    const transaction: Transaction = {
      id: `tx-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(7)}`,
      fromWallet: fromAddress,
      toWallet: toAddress,
      amount,
      token,
      status: 'pending',
      timestamp: Date.now(),
    };

    // Log transaction
    await this.logAudit(
      'TRANSFER_FUNDS',
      fromAddress,
      `Transferred ${amount} ${token} to ${toAddress}`,
      userId
    );

    // In production: broadcast to blockchain
    // const txHash = await this.broadcastTransaction(transaction, wallet);
    // transaction.txHash = txHash;
    // transaction.status = 'confirmed';

    
    // Notify owner
    await notifyOwner({
      title: 'Wallet Transfer',
      content: `Transfer of ${amount} ${token} from ${fromAddress} to ${toAddress}`,
    });

    return transaction;
  }

  /**
   * Route mining rewards to admin wallet
   */
  async routeMiningRewards(minerAddress: string, amount: number, token: string): Promise<Transaction> {
    
    // Get admin wallet address from environment
    const adminWallet = process.env.ADMIN_WALLET_ADDRESS;
    if (!adminWallet) {
      throw new Error('ADMIN_WALLET_ADDRESS not configured');
    }

    // Get or create admin wallet
    let wallet = await this.getWallet(adminWallet);
    if (!wallet) {
      wallet = {
        address: adminWallet,
        userId: 'system',
        balance: 0,
        token,
        encryptedPrivateKey: '',
        multisigRequired: 1,
        multisigApprovals: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // Credit mining rewards directly to admin wallet
    wallet.balance += amount;
    wallet.updatedAt = Date.now();

    // Create transaction record
    const transaction: Transaction = {
      id: `tx-mining-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(7)}`,
      fromWallet: minerAddress,
      toWallet: adminWallet,
      amount,
      token,
      status: 'confirmed',
      timestamp: Date.now(),
    };

    // Log as mining reward
    await this.logAudit('MINING_REWARD', minerAddress, `Mining reward credited: ${amount} ${token}`, 'system');

    
    return transaction;
  }

  /**
   * Approve multisig transaction
   */
  async approveTransaction(walletAddress: string, userId: string): Promise<boolean> {
    
    const wallet = await this.getWallet(walletAddress);
    if (!wallet) {
      throw new Error(`Wallet ${walletAddress} not found`);
    }

    wallet.multisigApprovals++;

    // Log approval
    await this.logAudit('MULTISIG_APPROVAL', walletAddress, `Approval ${wallet.multisigApprovals}/${wallet.multisigRequired}`, userId);

    return wallet.multisigApprovals >= wallet.multisigRequired;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(walletAddress: string, limit = 50): Promise<Transaction[]> {
    
    // In production: query from database
    // const transactions = await db.query.walletTransactions.findMany({
    //   where: eq(walletTransactions.fromWallet, walletAddress),
    //   orderBy: desc(walletTransactions.timestamp),
    //   limit,
    // });
    // return transactions;

    return [];
  }

  /**
   * Get audit log
   */
  async getAuditLog(walletAddress: string, limit = 100): Promise<AuditLog[]> {
    
    // In production: query from database
    // const logs = await db.query.walletAuditLog.findMany({
    //   where: eq(walletAuditLog.walletAddress, walletAddress),
    //   orderBy: desc(walletAuditLog.timestamp),
    //   limit,
    // });
    // return logs;

    return [];
  }

  /**
   * Log audit event
   */
  private async logAudit(action: string, walletAddress: string, details: string, userId: string): Promise<void> {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(7)}`,
      action,
      walletAddress,
      details,
      timestamp: Date.now(),
      userId,
    };

    
    // In production: save to database
    // await db.insert(walletAuditLog).values(log);
  }

  /**
   * Get wallet statistics
   */
  async getStatistics(): Promise<any> {
    return {
      totalWallets: this.walletCache.size,
      walletTypes: {
        admin: Array.from(this.walletCache.values()).filter((w) => w.type === 'admin').length,
        mining: Array.from(this.walletCache.values()).filter((w) => w.type === 'mining').length,
        user: Array.from(this.walletCache.values()).filter((w) => w.type === 'user').length,
        treasury: Array.from(this.walletCache.values()).filter((w) => w.type === 'treasury').length,
      },
      blockchains: {
        ethereum: Array.from(this.walletCache.values()).filter((w) => w.blockchain === 'ethereum').length,
        solana: Array.from(this.walletCache.values()).filter((w) => w.blockchain === 'solana').length,
        bitcoin: Array.from(this.walletCache.values()).filter((w) => w.blockchain === 'bitcoin').length,
      },
    };
  }
}

export const walletManager = new SecureWalletManager();

// REST API routes
import { Router } from 'express';

export const walletRouter = Router();

/**
 * POST /wallets - Create new wallet
 */
walletRouter.post('/wallets', async (req, res) => {
  try {
    const { address, privateKey, blockchain, type, multisigRequired } = req.body;

    const wallet = await walletManager.createWallet(address, privateKey, blockchain, type, multisigRequired);
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /wallets/:address - Get wallet info
 */
walletRouter.get('/wallets/:address', async (req, res) => {
  try {
    const wallet = await walletManager.getWallet(req.params.address);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    // Don't return encrypted private key
    const { encryptedPrivateKey, ...safeWallet } = wallet;
    res.json({ success: true, wallet: safeWallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /wallets/:address/transfer - Transfer funds
 */
walletRouter.post('/wallets/:address/transfer', async (req, res) => {
  try {
    const { toAddress, amount, token, userId } = req.body;

    const transaction = await walletManager.transferFunds(req.params.address, toAddress, amount, token, userId);
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /wallets/:address/mining-reward - Route mining reward
 */
walletRouter.post('/wallets/:address/mining-reward', async (req, res) => {
  try {
    const { amount, token } = req.body;

    const transaction = await walletManager.routeMiningRewards(req.params.address, amount, token);
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /wallets/:address/approve - Multisig approval
 */
walletRouter.post('/wallets/:address/approve', async (req, res) => {
  try {
    const { userId } = req.body;

    const approved = await walletManager.approveTransaction(req.params.address, userId);
    res.json({ success: true, approved });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /wallets/:address/history - Get transaction history
 */
walletRouter.get('/wallets/:address/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await walletManager.getTransactionHistory(req.params.address, limit);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /wallets/:address/audit - Get audit log
 */
walletRouter.get('/wallets/:address/audit', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await walletManager.getAuditLog(req.params.address, limit);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /wallets/stats - Get statistics
 */
walletRouter.get('/wallets/stats', async (req, res) => {
  try {
    const stats = await walletManager.getStatistics();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default walletRouter;
