import { EventEmitter } from 'events';
import net from 'net';
import { invokeLLM } from './_core/llm';

interface PoolConfig {
  name: string;
  url: string;
  port: number;
  coin: string;
  username: string;
  password: string;
  algorithm: string;
}

interface MinerStats {
  poolName: string;
  coin: string;
  hashrate: number; // H/s
  shares: {
    accepted: number;
    rejected: number;
    stale: number;
  };
  difficulty: number;
  lastShareTime: number;
  uptime: number; // seconds
  earnings: number; // in coin
  earningsUSD: number;
}

interface PoolConnection {
  socket: net.Socket;
  connected: boolean;
  authenticated: boolean;
  stats: MinerStats;
  subscriptionId?: string;
}

/**
 * Real Mining Pool Connector
 * Connects to actual mining pools using Stratum protocol
 * Supports: Bitcoin, Litecoin, Dogecoin, Ethereum Classic
 */
export class MiningPoolConnector extends EventEmitter {
  private connections: Map<string, PoolConnection> = new Map();
  private priceCache: Map<string, number> = new Map();
  private aiOptimizer: any = null;

  constructor() {
    super();
    this.initializePriceCache();
    this.startAIOptimizer();
  }

  /**
   * Connect to a mining pool
   */
  async connectToPool(config: PoolConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(config.port, config.url);
      
      const connection: PoolConnection = {
        socket,
        connected: false,
        authenticated: false,
        stats: {
          poolName: config.name,
          coin: config.coin,
          hashrate: 0,
          shares: { accepted: 0, rejected: 0, stale: 0 },
          difficulty: 0,
          lastShareTime: Date.now(),
          uptime: 0,
          earnings: 0,
          earningsUSD: 0,
        },
      };

      socket.on('connect', () => {
        connection.connected = true;
        console.log(`[MiningPoolConnector] Connected to pool: ${config.name}`);
        
        // Subscribe to mining work
        this.sendStratumCommand(socket, {
          id: 1,
          method: 'mining.subscribe',
          params: ['SkycoinMiner/1.0.0'],
        });

        resolve();
      });

      socket.on('data', (data) => {
        this.handlePoolMessage(connection, config, data.toString());
      });

      socket.on('error', (error) => {
        console.error(`[MiningPoolConnector] Pool connection error for ${config.name}: ${error.message}`);
        connection.connected = false;
        this.emit('pool-error', { pool: config.name, error: error.message });
        reject(error);
      });

      socket.on('close', () => {
        connection.connected = false;
                this.emit('pool-disconnected', { pool: config.name });
        
        // Attempt reconnection after 30 seconds
        setTimeout(() => this.connectToPool(config), 30000);
      });

      this.connections.set(config.name, connection);
    });
  }

  /**
   * Handle messages from mining pool
   */
  private handlePoolMessage(connection: PoolConnection, config: PoolConfig, data: string): void {
    const lines = data.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const message = JSON.parse(line);

        if (message.method === 'mining.notify') {
          // New work available
          this.emit('new-work', {
            pool: config.name,
            coin: config.coin,
            jobId: message.params[0],
            prevHash: message.params[1],
            coinbase1: message.params[2],
            coinbase2: message.params[3],
            merkleTree: message.params[4],
            blockVersion: message.params[5],
            networkDifficulty: message.params[6],
            nBits: message.params[7],
            nTime: message.params[8],
            cleanJobs: message.params[9],
          });
        } else if (message.method === 'mining.set_difficulty') {
          // Difficulty adjustment
          connection.stats.difficulty = message.params[0];
          console.log(`[MiningPoolConnector] Difficulty set for ${config.name}: ${connection.stats.difficulty}`);
        } else if (message.result !== null && message.result !== undefined) {
          // Response to our command
          if (message.id === 1) {
            // Subscribe response
            connection.subscriptionId = message.result[0][1];
            
            // Now authenticate
            this.sendStratumCommand(connection.socket, {
              id: 2,
              method: 'mining.authorize',
              params: [config.username, config.password],
            });
          } else if (message.id === 2) {
            // Authorization response
            connection.authenticated = message.result === true;
            if (connection.authenticated) {
                            this.emit('pool-authenticated', { pool: config.name });
            }
          } else if (message.id && message.id > 2) {
            // Share submission response
            if (message.result === true) {
              connection.stats.shares.accepted++;
              console.log(`[MiningPoolConnector] Share accepted for ${config.name}. Total accepted: ${connection.stats.shares.accepted}`);
              this.emit('share-accepted', {
                pool: config.name,
                coin: config.coin,
                shareId: message.id,
              });
            } else {
              connection.stats.shares.rejected++;
              console.warn(`[MiningPoolConnector] Share rejected for ${config.name}. Total rejected: ${connection.stats.shares.rejected}`);
            }
          }
        }
      } catch (error) {
        // Ignore parse errors
      }
    }
  }

  /**
   * Send command to mining pool
   */
  private sendStratumCommand(socket: net.Socket, command: any): void {
    socket.write(JSON.stringify(command) + '\n');
  }

  /**
   * Submit mining share
   */
  async submitShare(poolName: string, shareData: any): Promise<boolean> {
    const connection = this.connections.get(poolName);
    if (!connection || !connection.authenticated) {
            return false;
    }

    const shareId = Date.now();
    this.sendStratumCommand(connection.socket, {
      id: shareId,
      method: 'mining.submit',
      params: [
        shareData.username,
        shareData.jobId,
        shareData.nonce,
        shareData.nTime,
        shareData.solution,
      ],
    });

    return true;
  }

  /**
   * Get current mining statistics
   */
  getStats(poolName: string): MinerStats | null {
    const connection = this.connections.get(poolName);
    if (!connection) return null;

    // Update uptime
    connection.stats.uptime = Math.floor((Date.now() - connection.stats.lastShareTime) / 1000);

    // Calculate estimated earnings (simplified)
    const coinPrice = this.priceCache.get(connection.stats.coin) || 0;
    const acceptedShares = connection.stats.shares.accepted;
    const blockReward = this.getBlockReward(connection.stats.coin);
    const estimatedEarnings = (acceptedShares / 1000) * blockReward; // Simplified
    
    connection.stats.earnings = estimatedEarnings;
    connection.stats.earningsUSD = estimatedEarnings * coinPrice;

    return connection.stats;
  }

  /**
   * Get all active connections
   */
  getAllStats(): MinerStats[] {
    const stats: MinerStats[] = [];
    for (const [, connection] of this.connections) {
      if (connection.connected) {
        stats.push(this.getStats(connection.stats.poolName) || connection.stats);
      }
    }
    return stats;
  }

  /**
   * Initialize price cache
   */
  private initializePriceCache(): void {
    this.priceCache.set('BTC', 63800);
    this.priceCache.set('LTC', 89.50);
    this.priceCache.set('DOGE', 0.072);
    this.priceCache.set('ETC', 28.45);
  }

  /**
   * Get block reward for coin
   */
  private getBlockReward(coin: string): number {
    const rewards: Record<string, number> = {
      BTC: 6.25,
      LTC: 6.25,
      DOGE: 10000,
      ETC: 3.2,
    };
    return rewards[coin] || 0;
  }

  /**
   * Start AI optimizer for automatic coin switching
   */
  private startAIOptimizer(): void {
    setInterval(async () => {
      try {
        const stats = this.getAllStats();
        if (stats.length === 0) return;

        // Calculate profitability for each pool
        const profitability = stats.map(s => ({
          pool: s.poolName,
          coin: s.coin,
          profitUSD: s.earningsUSD,
          shares: s.shares.accepted,
        }));

        // Use AI to recommend best coin to mine
        const recommendation = await this.getAIRecommendation(profitability);
        this.emit('ai-recommendation', recommendation);
      } catch (error) {
        console.error(`[MiningPoolConnector] Error in AI optimizer: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, 60000); // Run every minute
  }

  /**
   * Get AI recommendation for mining optimization
   */
  private async getAIRecommendation(profitability: any[]): Promise<any> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency mining optimizer. Analyze profitability data and recommend which coin to mine for maximum earnings.',
          },
          {
            role: 'user',
            content: `Current mining profitability:\n${JSON.stringify(profitability, null, 2)}\n\nRecommend the best coin to mine and explain why.`,
          },
        ],
      });

      return {
        recommendation: response.choices[0].message.content,
        timestamp: Date.now(),
        profitability,
      };
    } catch (error) {
            return null;
    }
  }

  /**
   * Disconnect from all pools
   */
  async disconnectAll(): Promise<void> {
    for (const [name, connection] of this.connections) {
      connection.socket.destroy();
      console.log(`[MiningPoolConnector] Disconnected from pool: ${name}`);
    }
    this.connections.clear();
  }
}

// Export singleton instance
export const miningPoolConnector = new MiningPoolConnector();
