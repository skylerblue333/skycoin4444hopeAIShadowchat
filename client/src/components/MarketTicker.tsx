import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'crypto' | 'stock';
}

export default function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([
    // Crypto
    { symbol: 'BTC', name: 'Bitcoin', price: 62023, change: 1200, changePercent: 2.0, type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 1732.1, change: 45.2, changePercent: 2.7, type: 'crypto' },
    { symbol: 'SOL', name: 'Solana', price: 81.37, change: 2.1, changePercent: 2.7, type: 'crypto' },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.076359, change: 0.004, changePercent: 5.5, type: 'crypto' },
    { symbol: 'TRUMP', name: 'Trump Coin', price: 8.42, change: 0.65, changePercent: 8.4, type: 'crypto' },
    { symbol: 'SKY444', name: 'Skycoin', price: 4.44, change: 0.44, changePercent: 11.0, type: 'crypto' },
    
    // Stocks
    { symbol: 'AAPL', name: 'Apple', price: 189.45, change: 2.1, changePercent: 1.1, type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft', price: 425.67, change: 5.2, changePercent: 1.2, type: 'stock' },
    { symbol: 'GOOGL', name: 'Google', price: 178.92, change: 1.8, changePercent: 1.0, type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon', price: 198.34, change: 3.2, changePercent: 1.6, type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla', price: 245.67, change: -2.1, changePercent: -0.8, type: 'stock' },
    { symbol: 'NVDA', name: 'Nvidia', price: 892.45, change: 15.3, changePercent: 1.7, type: 'stock' },
  ]);

  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    // Simulate live price updates
    const interval = setInterval(() => {
      setTickers(prev => prev.map(ticker => ({
        ...ticker,
        price: ticker.price * (1 + ((Math.random()) - 0.5) * 0.001),
        change: ((Math.random()) - 0.5) * 10,
        changePercent: ((Math.random()) - 0.5) * 5,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Smooth scrolling animation
    const scroll = setInterval(() => {
      setScrollPosition(prev => (prev + 1) % 1000);
    }, 30);

    return () => clearInterval(scroll);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-white/10 overflow-hidden">
      {/* Ticker Container */}
      <div className="flex items-center gap-8 px-4 py-3 whitespace-nowrap overflow-x-auto scrollbar-hide">
        {/* Crypto Section */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Crypto</span>
          {tickers
            .filter(t => t.type === 'crypto')
            .map(ticker => (
              <div key={ticker.symbol} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <span className="font-semibold text-white text-sm">{ticker.symbol}</span>
                <span className="text-white/70 text-xs">${ticker.price.toFixed(2)}</span>
                <div className={`flex items-center gap-1 text-xs font-bold ${ticker.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {ticker.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {ticker.changePercent >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Stocks Section */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Stocks</span>
          {tickers
            .filter(t => t.type === 'stock')
            .map(ticker => (
              <div key={ticker.symbol} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <span className="font-semibold text-white text-sm">{ticker.symbol}</span>
                <span className="text-white/70 text-xs">${ticker.price.toFixed(2)}</span>
                <div className={`flex items-center gap-1 text-xs font-bold ${ticker.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {ticker.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {ticker.changePercent >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Gradient fade effect */}
      <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
    </div>
  );
}
