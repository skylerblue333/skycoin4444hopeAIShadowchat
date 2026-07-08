import crypto from 'crypto';
import { db } from './db';
import { storagePut } from './storage';
import { notifyOwner } from './_core/notification';

interface WalletConfig {
  userId: string;
  primaryWallet: string; // Ethereum address
  secondaryWallet?: string;
  autoConvertToETH: boolean;
  autoWithdraw: boolean;
  withdrawalThreshold: number; // USD amount
  withdrawalFrequency: 'daily' | 'weekly' | 'monthly';
}

interface RewardTransaction {
  id: string;
  userId: string;
  coin: string;
  amount: number;
  usdValue: number;
  sourcePool: string;
  destinationWallet: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  timestamp: number;
  convertedToETH?: boolean;
}

/**
 * Wallet Reward Router
 * Automatically routes mining rewards to user's wallet
 * Handles conversion and withdrawal logic
 */
export class WalletRewardRouter {
  private walletConfigs: Map<string, WalletConfig> = new Map();
  private rewardHistory: Map<string, RewardTransaction[]> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startRewardProcessing();
  }

  /**
   * Configure wallet for a user
   */
  async configureWallet(config: WalletConfig): Promise<void> {
    // Validate Ethereum address
    if (!this.isValidEthereumAddress(config.primaryWallet)) {
      throw new Error('Invalid Ethereum address');
    }

    this.walletConfigs.set(config.userId, config);
    this.rewardHistory.set(config.userId, []);

    
    // Notify owner
    await notifyOwner({
      title: 'Wallet Configuration Updated',
      content: `User ${config.userId} configured wallet: ${config.primaryWallet}. Auto-convert: ${config.autoConvertToETH}, Auto-withdraw: ${config.autoWithdraw}`,
    });
  }

  /**
   * Get wallet configuration
   */
  getWalletConfig(userId: string): WalletConfig | null {
    return this.walletConfigs.get(userId) || null;
  }

  /**
   * Record mining reward
   */
  async recordReward(
    userId: string,
    coin: string,
    amount: number,
    usdValue: number,
    sourcePool: string
  ): Promise<RewardTransaction> {
    const config = this.walletConfigs.get(userId);
    if (!config) {
      throw new Error(`No wallet configured for user ${userId}`);
    }

    const transaction: RewardTransaction = {
      id: `reward-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
      userId,
      coin,
      amount,
      usdValue,
      sourcePool,
      destinationWallet: config.primaryWallet,
      status: 'pending',
      timestamp: Date.now(),
    };

    // Store transaction
    const history = this.rewardHistory.get(userId) || [];
    history.push(transaction);
    this.rewardHistory.set(userId, history);

    return transaction;
  }

  /**
   * Start automatic reward processing
   */
  private startRewardProcessing(): void {
    this.processingInterval = setInterval(async () => {
      try {
        await this.processRewards();
      } catch (error) {
        console.error('Error processing rewards:', error);
        await notifyOwner({
          title: 'Reward Processing Failed',
          content: `Error processing rewards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }, 60000); // Process every minute
  }

  /**
   * Process pending rewards
   */
  private async processRewards(): Promise<void> {
    for (const [userId, config] of this.walletConfigs) {
      const history = this.rewardHistory.get(userId) || [];
      const pendingRewards = history.filter(r => r.status === 'pending');

      if (pendingRewards.length === 0) continue;

      // Calculate total pending value
      const totalUSD = pendingRewards.reduce((sum, r) => sum + r.usdValue, 0);

      // Check if should process
      if (config.autoWithdraw && totalUSD >= config.withdrawalThreshold) {
        await this.processWithdrawal(userId, config, pendingRewards);
      } else if (config.autoConvertToETH) {
        await this.convertToETH(userId, config, pendingRewards);
      }
    }
  }

  /**
   * Convert rewards to ETH
   */
  private async convertToETH(
    userId: string,
    config: WalletConfig,
    rewards: RewardTransaction[]
  ): Promise<void> {
    
    for (const reward of rewards) {
      try {
        // Simulate conversion (in production, use Uniswap or similar)
        const ethAmount = await this.getETHEquivalent(reward.coin, reward.amount);

        reward.status = 'processing';
        reward.convertedToETH = true;

        // Simulate blockchain transaction
        reward.txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
        reward.status = 'completed';

        // console.log(`Converted ${reward.amount} ${reward.coin} to ${ethAmount.toFixed(6)} ETH`);

        // Notify owner
        await notifyOwner({
          title: 'Reward Converted to ETH',
          content: `${reward.amount} ${reward.coin} converted to ${ethAmount.toFixed(6)} ETH. TX: ${reward.txHash}`,
        });
      } catch (error) {
        reward.status = 'failed';
        console.error(`Error converting reward to ETH for user ${userId}:`, error);
      }
    }
  }

  /**
   * Process withdrawal to wallet
   */
  private async processWithdrawal(
    userId: string,
    config: WalletConfig,
    rewards: RewardTransaction[]
  ): Promise<void> {
    
    try {
      // Calculate total ETH to send
      let totalETH = 0;
      for (const reward of rewards) {
        const ethAmount = await this.getETHEquivalent(reward.coin, reward.amount);
        totalETH += ethAmount;
      }

      // Simulate blockchain transaction
      const withdrawalTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;

      // Update all rewards as completed
      for (const reward of rewards) {
        reward.status = 'completed';
        reward.txHash = withdrawalTxHash;
      }

      console.log(`Withdrew ${totalETH.toFixed(6)} ETH to ${config.primaryWallet}`);
      
      // Notify owner
      await notifyOwner({
        title: 'Mining Rewards Withdrawn',
        content: `${totalETH.toFixed(6)} ETH withdrawn to ${config.primaryWallet}. TX: ${withdrawalTxHash}. Rewards: ${rewards.length}`,
      });
    } catch (error) {
      for (const reward of rewards) {
        reward.status = 'failed';
      }
      console.error('Withdrawal failed:', error);
    }
  }

  /**
   * Get ETH equivalent for coin amount
   */
  private async getETHEquivalent(coin: string, amount: number): Promise<number> {
    // Get current prices
    const prices: Record<string, number> = {
      BTC: 63800,
      LTC: 89.50,
      DOGE: 0.072,
      ETC: 28.45,
    };

    const ETH_PRICE = 3891; // USD per ETH

    const coinPrice = prices[coin] || 0;
    const usdValue = amount * coinPrice;
    const ethAmount = usdValue / ETH_PRICE;

    return ethAmount;
  }

  /**
   * Validate Ethereum address
   */
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get reward history for user
   */
  getRewardHistory(userId: string, limit: number = 50): RewardTransaction[] {
    const history = this.rewardHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Get total earnings for user
   */
  getTotalEarnings(userId: string): { coins: Record<string, number>; usd: number } {
    const history = this.rewardHistory.get(userId) || [];
    const coins: Record<string, number> = {};
    let totalUSD = 0;

    for (const reward of history) {
      if (reward.status === 'completed') {
        coins[reward.coin] = (coins[reward.coin] || 0) + reward.amount;
        totalUSD += reward.usdValue;
      }
    }

    return { coins, usd: totalUSD };
  }

  /**
   * Stop reward processing
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Export singleton
export const walletRewardRouter = new WalletRewardRouter();