import crypto from 'crypto';

interface PoolCredential {
  id: string;
  poolName: string;
  coin: string;
  username: string;
  password: string; // Encrypted
  poolUrl: string;
  poolPort: number;
  isActive: boolean;
  createdAt: number;
  lastUsed?: number;
}

interface MinerConfig {
  id: string;
  name: string;
  hardwareType: string;
  hashrate: number;
  power: number;
  assignedPool: string;
  isActive: boolean;
  createdAt: number;
}

/**
 * Pool Credentials Manager
 * Securely manages mining pool credentials and hardware configuration
 */
export class PoolCredentialsManager {
  private credentials: Map<string, PoolCredential> = new Map();
  private minerConfigs: Map<string, MinerConfig> = new Map();
  private encryptionKey = process.env.POOL_ENCRYPTION_KEY || 'default-key-change-in-production';

  /**
   * Add pool credentials
   */
  addPoolCredential(
    poolName: string,
    coin: string,
    username: string,
    password: string,
    poolUrl: string,
    poolPort: number
  ): PoolCredential {
    const id = `pool-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`;
    
    const credential: PoolCredential = {
      id,
      poolName,
      coin,
      username,
      password: this.encryptPassword(password),
      poolUrl,
      poolPort,
      isActive: true,
      createdAt: Date.now(),
    };

    this.credentials.set(id, credential);
    console.log(`Pool credential ${poolName} (${coin}) added.`);

    return credential;
  }

  /**
   * Get pool credential (decrypted)
   */
  getPoolCredential(id: string): PoolCredential | null {
    const cred = this.credentials.get(id);
    if (!cred) return null;

    return {
      ...cred,
      password: this.decryptPassword(cred.password),
    };
  }

  /**
   * Get all active pool credentials
   */
  getActiveCredentials(): PoolCredential[] {
    const active: PoolCredential[] = [];
    for (const [, cred] of this.credentials) {
      if (cred.isActive) {
        active.push({
          ...cred,
          password: this.decryptPassword(cred.password),
        });
      }
    }
    return active;
  }

  /**
   * Get credentials by coin
   */
  getCredentialsByCoin(coin: string): PoolCredential[] {
    const result: PoolCredential[] = [];
    for (const [, cred] of this.credentials) {
      if (cred.coin === coin && cred.isActive) {
        result.push({
          ...cred,
          password: this.decryptPassword(cred.password),
        });
      }
    }
    return result;
  }

  /**
   * Deactivate pool credential
   */
  deactivateCredential(id: string): boolean {
    const cred = this.credentials.get(id);
    if (!cred) return false;

    cred.isActive = false;
        return true;
  }

  /**
   * Add miner configuration
   */
  addMinerConfig(
    name: string,
    hardwareType: string,
    hashrate: number,
    power: number,
    assignedPool: string
  ): MinerConfig {
    const id = `miner-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`;

    const config: MinerConfig = {
      id,
      name,
      hardwareType,
      hashrate,
      power,
      assignedPool,
      isActive: true,
      createdAt: Date.now(),
    };

    this.minerConfigs.set(id, config);
    console.log(`Miner config ${name} added.`);

    return config;
  }

  /**
   * Get miner configuration
   */
  getMinerConfig(id: string): MinerConfig | null {
    return this.minerConfigs.get(id) || null;
  }

  /**
   * Get all active miner configurations
   */
  getActiveMinerConfigs(): MinerConfig[] {
    const active: MinerConfig[] = [];
    for (const [, config] of this.minerConfigs) {
      if (config.isActive) {
        active.push(config);
      }
    }
    return active;
  }

  /**
   * Update miner pool assignment
   */
  updateMinerPoolAssignment(minerId: string, poolId: string): boolean {
    const config = this.minerConfigs.get(minerId);
    if (!config) return false;

    config.assignedPool = poolId;
        return true;
  }

  /**
   * Deactivate miner
   */
  deactivateMiner(id: string): boolean {
    const config = this.minerConfigs.get(id);
    if (!config) return false;

    config.isActive = false;
        return true;
  }

  /**
   * Get mining configuration summary
   */
  getConfigurationSummary() {
    const activeCredentials = this.getActiveCredentials();
    const activeMiners = this.getActiveMinerConfigs();

    const totalHashrate = activeMiners.reduce((sum, m) => sum + m.hashrate, 0);
    const totalPower = activeMiners.reduce((sum, m) => sum + m.power, 0);

    const coinDistribution: Record<string, number> = {};
    for (const cred of activeCredentials) {
      coinDistribution[cred.coin] = (coinDistribution[cred.coin] || 0) + 1;
    }

    return {
      poolCount: activeCredentials.length,
      minerCount: activeMiners.length,
      totalHashrate,
      totalPower,
      coinDistribution,
      pools: activeCredentials.map(c => ({
        name: c.poolName,
        coin: c.coin,
        url: c.poolUrl,
        port: c.poolPort,
      })),
      miners: activeMiners.map(m => ({
        name: m.name,
        hardware: m.hardwareType,
        hashrate: m.hashrate,
        power: m.power,
      })),
    };
  }

  /**
   * Encrypt password
   */
  private encryptPassword(password: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt password
   */
  private decryptPassword(encrypted: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const parts = encrypted.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(parts[1], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
            return '';
    }
  }

  /**
   * Export configuration (for backup)
   */
  exportConfiguration(): string {
    const data = {
      credentials: Array.from(this.credentials.values()),
      miners: Array.from(this.minerConfigs.values()),
      exportedAt: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import configuration (from backup)
   */
  importConfiguration(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Import credentials
      for (const cred of data.credentials) {
        this.credentials.set(cred.id, cred);
      }

      // Import miners
      for (const miner of data.miners) {
        this.minerConfigs.set(miner.id, miner);
      }

            return true;
    } catch (error) {
            return false;
    }
  }
}

// Export singleton
export const poolCredentialsManager = new PoolCredentialsManager();
