import { cryptoTradingAI } from './crypto-trading-ai';
import { miningAIOptimizer } from './mining-ai-optimizer';
import { defiAIAnalyzer } from './defi-ai-analyzer';
import { smartContractAuditor } from './smart-contract-auditor';
import { unifiedAIOrchestrator } from './unified-ai-orchestrator';

interface CryptoAIRequest {
  type: 'trading' | 'mining' | 'defi' | 'audit' | 'comprehensive';
  data: any;
}

interface CryptoAIResponse {
  type: string;
  result: any;
  timestamp: number;
  module: string;
}

class CryptoAIModule {
  async process(request: CryptoAIRequest): Promise<CryptoAIResponse> {
    const timestamp = Date.now();

    switch (request.type) {
      case 'trading':
        return {
          type: 'trading',
          result: await this.processTradingRequest(request.data),
          timestamp,
          module: 'CryptoTradingAI'
        };

      case 'mining':
        return {
          type: 'mining',
          result: await this.processMiningRequest(request.data),
          timestamp,
          module: 'MiningAIOptimizer'
        };

      case 'defi':
        return {
          type: 'defi',
          result: await this.processDeFiRequest(request.data),
          timestamp,
          module: 'DeFiAIAnalyzer'
        };

      case 'audit':
        return {
          type: 'audit',
          result: await this.processAuditRequest(request.data),
          timestamp,
          module: 'SmartContractAuditor'
        };

      case 'comprehensive':
        return {
          type: 'comprehensive',
          result: await this.processComprehensiveRequest(request.data),
          timestamp,
          module: 'CryptoAIModule'
        };

      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  private async processTradingRequest(data: any): Promise<any> {
    const { symbol, priceHistory, marketData } = data;
    return await cryptoTradingAI.analyzeTrade(symbol, priceHistory, marketData);
  }

  private async processMiningRequest(data: any): Promise<any> {
    const { pools, minerHashrate } = data;
    return await miningAIOptimizer.selectOptimalPool(pools, minerHashrate);
  }

  private async processDeFiRequest(data: any): Promise<any> {
    const { protocol, capital } = data;
    return await defiAIAnalyzer.assessProtocolRisk(protocol);
  }

  private async processAuditRequest(data: any): Promise<any> {
    const { contractCode, contractName } = data;
    return await smartContractAuditor.auditContract(contractCode, contractName);
  }

  private async processComprehensiveRequest(data: any): Promise<any> {
    const results = {
      trading: await cryptoTradingAI.analyzeTrade(data.symbol, data.priceHistory, data.marketData),
      mining: await miningAIOptimizer.selectOptimalPool(data.pools, data.minerHashrate),
      defi: await defiAIAnalyzer.assessProtocolRisk(data.protocol),
      audit: await smartContractAuditor.auditContract(data.contractCode, data.contractName)
    };

    return results;
  }

  async getPortfolioInsights(portfolio: any): Promise<Record<string, any>> {
    return {
      tradingSignals: await cryptoTradingAI.optimizePortfolio(
        Object.keys(portfolio),
        portfolio
      ),
      miningOpportunities: await miningAIOptimizer.selectOptimalPool([], 1000),
      defiYield: await defiAIAnalyzer.optimizeYieldFarming([], 10000),
      riskAssessment: 'Moderate'
    };
  }
}

export const cryptoAIModule = new CryptoAIModule();
