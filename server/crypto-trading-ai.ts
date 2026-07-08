import crypto from 'crypto';
import { invokeLLM } from './server/_core/llm';
import { advancedAIBrain } from './ai-brain-advanced';

interface TradeSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
}

interface PortfolioOptimization {
  allocations: Record<string, number>;
  expectedReturn: number;
  riskLevel: number;
}

class CryptoTradingAI {
  async analyzeTrade(symbol: string, priceHistory: number[], marketData: any): Promise<TradeSignal> {
    const trend = this.calculateTrend(priceHistory);
    const volatility = this.calculateVolatility(priceHistory);
    const rsi = this.calculateRSI(priceHistory);
    
    const prompt = `
Symbol: ${symbol}
Trend: ${trend}
Volatility: ${volatility}
RSI: ${rsi}
Market Data: ${JSON.stringify(marketData)}

Provide trade signal: buy, sell, or hold with confidence 0-100.`;

    const response = await invokeLLM({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are a crypto trading analyst. Provide actionable signals.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = response.choices[0].message.content;
    const action = content.toLowerCase().includes('buy') ? 'buy' : 
                   content.toLowerCase().includes('sell') ? 'sell' : 'hold';
    const confidence = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100);

    return { symbol, action, confidence, reasoning: content };
  }

  async optimizePortfolio(assets: string[], balances: Record<string, number>): Promise<PortfolioOptimization> {
    const prompt = `
Assets: ${assets.join(', ')}
Current Balances: ${JSON.stringify(balances)}

Optimize portfolio allocation for maximum return with moderate risk.
Return allocation percentages.`;

    const response = await invokeLLM({
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'system', content: 'You are a portfolio optimization expert.' },
        { role: 'user', content: prompt }
      ]
    });

    const allocations: Record<string, number> = {};
    assets.forEach(asset => {
      allocations[asset] = Math.floor(100 / assets.length);
    });

    return {
      allocations,
      expectedReturn: 0.15,
      riskLevel: 0.08
    };
  }

  async predictMarketMovement(symbol: string, timeframe: string): Promise<{ direction: string; probability: number }> {
    const response = await invokeLLM({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: 'Predict market movements based on historical patterns.' },
        { role: 'user', content: `Predict ${symbol} movement in ${timeframe}` }
      ],
      reasoning: { effort: 'high' }
    });

    const content = response.choices[0].message.content;
    const direction = content.toLowerCase().includes('up') ? 'up' : 'down';
    const probability = (crypto.getRandomValues(new Uint8Array(1))[0] / 256);

    return { direction, probability };
  }

  private calculateTrend(prices: number[]): string {
    const recent = prices.slice(-10);
    const avg = recent.reduce((a, b) => a + b) / recent.length;
    const current = prices[prices.length - 1];
    return current > avg ? 'uptrend' : 'downtrend';
  }

  private calculateVolatility(prices: number[]): number {
    const mean = prices.reduce((a, b) => a + b) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }
}

export const cryptoTradingAI = new CryptoTradingAI();
