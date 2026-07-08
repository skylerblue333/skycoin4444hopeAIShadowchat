import { notifyOwner } from './_core/notification';

/**
 * Coinbase Integration - Convert crypto mining rewards to real USD
 * Handles automated withdrawal to bank account
 */

interface CoinbaseAccount {
  id: string;
  name: string;
  balance: {
    amount: string;
    currency: string;
  };
  type: string;
}

interface CoinbaseTransaction {
  id: string;
  type: string;
  status: string;
  amount: {
    amount: string;
    currency: string;
  };
  description: string;
  created_at: string;
  updated_at: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  bankAccount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  transactionId?: string;
}

class CoinbaseIntegration {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.coinbase.com/v2';
  private withdrawals: WithdrawalRequest[] = [];
  private totalWithdrawn = 0;

  constructor() {
    this.apiKey = process.env.COINBASE_API_KEY || '';
    this.apiSecret = process.env.COINBASE_PRIVATE_KEY || '';

    if (!this.apiKey || !this.apiSecret) {
          }
  }

  /**
   * Get Coinbase account balance
   */
  async getAccountBalance(): Promise<{ btc: number; eth: number; usd: number }> {
    try {
      if (!this.apiKey) {
                return { btc: 0, eth: 0, usd: 0 };
      }

      const response = await fetch(`${this.baseUrl}/accounts`, {
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': this.generateSignature('GET', '/v2/accounts', ''),
          'CB-ACCESS-TIMESTAMP': Date.now().toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`Coinbase API error: ${response.statusText}`);
      }

      const data = await response.json();
      const accounts = data.data || [];

      const balances = {
        btc: 0,
        eth: 0,
        usd: 0,
      };

      for (const account of accounts) {
        const amount = parseFloat(account.balance.amount);
        if (account.currency === 'BTC') balances.btc = amount;
        if (account.currency === 'ETH') balances.eth = amount;
        if (account.currency === 'USD') balances.usd = amount;
      }

            return balances;
    } catch (error) {
            return { btc: 0, eth: 0, usd: 0 };
    }
  }

  /**
   * Convert crypto to USD
   */
  async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/exchange-rates?currency=${fromCurrency}`, {
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': this.generateSignature('GET', `/v2/exchange-rates?currency=${fromCurrency}`, ''),
          'CB-ACCESS-TIMESTAMP': Date.now().toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`Coinbase API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rate = parseFloat(data.data.rates.USD);

      return amount * rate;
    } catch (error) {
            return 0;
    }
  }

  /**
   * Sell crypto for USD
   */
  async sellCrypto(amount: number, currency: string): Promise<{ success: boolean; usdAmount: number; transactionId?: string }> {
    try {
      if (!this.apiKey) {
        throw new Error('Coinbase API key not configured');
      }

      // Get the account for this currency
      const accountResponse = await fetch(`${this.baseUrl}/accounts`, {
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': this.generateSignature('GET', '/v2/accounts', ''),
          'CB-ACCESS-TIMESTAMP': Date.now().toString(),
        },
      });

      const accountData = await accountResponse.json();
      const account = accountData.data.find((acc: any) => acc.currency === currency);

      if (!account) {
        throw new Error(`No account found for ${currency}`);
      }

      // Create sell order
      const sellData = {
        type: 'sell',
        amount: amount.toString(),
        currency: currency,
      };

      const sellResponse = await fetch(`${this.baseUrl}/accounts/${account.id}/sells`, {
        method: 'POST',
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': this.generateSignature('POST', `/v2/accounts/${account.id}/sells`, JSON.stringify(sellData)),
          'CB-ACCESS-TIMESTAMP': Date.now().toString(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sellData),
      });

      if (!sellResponse.ok) {
        throw new Error(`Failed to sell ${currency}: ${sellResponse.statusText}`);
      }

      const result = await sellResponse.json();
      const usdAmount = parseFloat(result.data.amount.amount);
      console.log(`[Coinbase] Sold ${amount} ${currency} for $${usdAmount.toFixed(2)} USD`);

      await notifyOwner({
        title: '💱 Crypto Sold on Coinbase',
        content: `Successfully sold ${amount} ${currency} for $${usdAmount.toFixed(2)} USD on Coinbase`,
      });

      return {
        success: true,
        usdAmount,
        transactionId: result.data.id,
      };
    } catch (error) {
      
      await notifyOwner({
        title: '❌ Coinbase Sale Failed',
        content: `Failed to sell ${amount} ${currency}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      return {
        success: false,
        usdAmount: 0,
      };
    }
  }

  /**
   * Withdraw USD to bank account
   */
  async withdrawToBank(amount: number, bankAccountId: string): Promise<WithdrawalRequest> {
    const withdrawalId = `withdrawal-${Date.now()}`;

    const withdrawal: WithdrawalRequest = {
      id: withdrawalId,
      amount,
      currency: 'USD',
      bankAccount: bankAccountId,
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      if (!this.apiKey) {
        throw new Error('Coinbase API key not configured');
      }

      // Get USD account
      const accountResponse = await fetch(`${this.baseUrl}/accounts`, {
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': this.generateSignature('GET', '/v2/accounts', ''),
          'CB-ACCESS-TIMESTAMP': Date.now().toString(),
        },
      });

      const accountData = await accountResponse.json();
      const usdAccount = accountData.data.find((acc: any) => acc.currency === 'USD');

      if (!usdAccount) {
        throw new Error('No USD account found');
      }

      // Create withdrawal
      const withdrawData = {
        type: 'transfer',
        to: bankAccountId,
        amount: amount.toString(),
        currency: 'USD',
      };

      const withdrawResponse = await fetch(`${this.baseUrl}/accounts/${usdAccount.id}/withdrawals`, {
        method: 'POST',
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': this.generateSignature('POST', `/v2/accounts/${usdAccount.id}/withdrawals`, JSON.stringify(withdrawData)),
          'CB-ACCESS-TIMESTAMP': Date.now().toString(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawData),
      });

      if (!withdrawResponse.ok) {
        throw new Error(`Withdrawal failed: ${withdrawResponse.statusText}`);
      }

      const result = await withdrawResponse.json();

      withdrawal.status = 'processing';
      withdrawal.transactionId = result.data.id;
      withdrawal.completedAt = Date.now();

      console.log(`[Coinbase] Successfully initiated withdrawal of $${amount.toFixed(2)} to bank account ${bankAccountId}`);

      this.withdrawals.push(withdrawal);
      this.totalWithdrawn += amount;

      await notifyOwner({
        title: '🏦 Withdrawal Initiated',
        content: `$${amount.toFixed(2)} withdrawal to bank account initiated. Transaction ID: ${result.data.id}`,
      });

      return withdrawal;
    }
    catch (error) {
      withdrawal.status = 'failed';

      
      await notifyOwner({
        title: '❌ Withdrawal Failed',
        content: `Failed to withdraw $${amount.toFixed(2)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      return withdrawal;
    }
  }

  /**
   * Get withdrawal history
   */
  getWithdrawalHistory(limit = 50): WithdrawalRequest[] {
    return this.withdrawals.slice(-limit);
  }

  /**
   * Get total withdrawn amount
   */
  getTotalWithdrawn(): number {
    return this.totalWithdrawn;
  }

  /**
   * Generate HMAC signature for Coinbase API
   */
  private generateSignature(method: string, path: string, body: string): string {
    // This is a simplified version - in production, use proper HMAC-SHA256
    // For now, return a placeholder
    return 'signature-placeholder';
  }

  /**
   * Automated daily withdrawal to bank
   */
  async startAutomatedWithdrawals(bankAccountId: string, dailyAmount: number): Promise<void> {
    
    // Run daily at 2 AM UTC
    const now = new Date();
    const nextRun = new Date();
    nextRun.setUTCHours(2, 0, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        // Check balance first
        const balance = await this.getAccountBalance();

        if (balance.usd >= dailyAmount) {
          await this.withdrawToBank(dailyAmount, bankAccountId);
        } else {
          console.warn("[Coinbase] Insufficient USD balance for automated withdrawal.");
        }
      } catch (error) {
        console.error(`[Coinbase] Error during automated withdrawal: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Schedule next withdrawal
      setInterval(async () => {
        try {
          const balance = await this.getAccountBalance();

          if (balance.usd >= dailyAmount) {
            await this.withdrawToBank(dailyAmount, bankAccountId);
          }
        } catch (error) {
          console.error(`[Coinbase] Error during scheduled withdrawal: ${error instanceof Error ? error.message : String(error)}`);
        }
      }, 86400000); // 24 hours
    }, delay);
  }
}

export const coinbaseIntegration = new CoinbaseIntegration();
