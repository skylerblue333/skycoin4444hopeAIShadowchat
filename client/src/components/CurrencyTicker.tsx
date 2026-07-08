import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  change: number;
  changePercent: number;
  region: string;
}

export default function CurrencyTicker() {
  const [currencies, setCurrencies] = useState<Currency[]>([
    // Americas
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, change: 0, changePercent: 0, region: 'Americas' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.36, change: 0.02, changePercent: 1.5, region: 'Americas' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '₱', rate: 17.05, change: 0.15, changePercent: 0.9, region: 'Americas' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 4.97, change: -0.08, changePercent: -1.6, region: 'Americas' },
    
    // Europe
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, change: 0.01, changePercent: 1.1, region: 'Europe' },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, change: -0.005, changePercent: -0.6, region: 'Europe' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.88, change: 0.002, changePercent: 0.2, region: 'Europe' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 10.45, change: 0.08, changePercent: 0.8, region: 'Europe' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 10.68, change: 0.12, changePercent: 1.1, region: 'Europe' },
    
    // Asia-Pacific
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 149.50, change: 2.1, changePercent: 1.4, region: 'Asia-Pacific' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.24, change: 0.05, changePercent: 0.7, region: 'Asia-Pacific' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.12, change: 0.15, changePercent: 0.2, region: 'Asia-Pacific' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.52, change: 0.02, changePercent: 1.3, region: 'Asia-Pacific' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.65, change: 0.03, changePercent: 1.8, region: 'Asia-Pacific' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.34, change: 0.01, changePercent: 0.7, region: 'Asia-Pacific' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.81, change: 0.02, changePercent: 0.3, region: 'Asia-Pacific' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1298.50, change: 5.2, changePercent: 0.4, region: 'Asia-Pacific' },
    
    // Middle East & Africa
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67, change: 0, changePercent: 0, region: 'Middle East' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', rate: 3.75, change: 0, changePercent: 0, region: 'Middle East' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.45, change: 0.25, changePercent: 1.4, region: 'Africa' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£', rate: 30.90, change: 0.15, changePercent: 0.5, region: 'Africa' },
  ]);

  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [conversionAmount, setConversionAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');

  useEffect(() => {
    // Simulate live price updates
    const interval = setInterval(() => {
      setCurrencies(prev => prev.map(currency => ({
        ...currency,
        rate: currency.rate * (1 + ((Math.random()) - 0.5) * 0.001),
        change: ((Math.random()) - 0.5) * 0.1,
        changePercent: ((Math.random()) - 0.5) * 2,
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const regions = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East', 'Africa'];
  const filteredCurrencies = selectedRegion === 'All' 
    ? currencies 
    : currencies.filter(c => c.region === selectedRegion);

  const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
  const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
  const convertedAmount = (conversionAmount / fromRate) * toRate;

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 py-8">
      <div className="container max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <h2 className="text-3xl font-bold text-white">Global Currency Exchange</h2>
          </div>
          <p className="text-white/60">Real-time exchange rates updated every 5 seconds</p>
        </div>

        {/* Converter */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Currency Converter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* From Currency */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">From</label>
              <div className="flex gap-2">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code} className="bg-slate-900">
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">Amount</label>
              <input
                type="number"
                value={conversionAmount}
                onChange={(e) => setConversionAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* To Currency */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">To</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code} className="bg-slate-900">
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result */}
          <div className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
            <p className="text-white/70 text-sm mb-1">Result</p>
            <p className="text-2xl font-bold text-cyan-400">
              {conversionAmount.toFixed(2)} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
            </p>
            <p className="text-white/50 text-xs mt-2">
              1 {fromCurrency} = {(toRate / fromRate).toFixed(4)} {toCurrency}
            </p>
          </div>
        </div>

        {/* Region Filter */}
        <div className="flex flex-wrap gap-2">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedRegion === region
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Currency Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCurrencies.map(currency => (
            <div
              key={currency.code}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-white text-lg">{currency.code}</div>
                  <div className="text-white/60 text-xs">{currency.name}</div>
                </div>
                <div className="text-2xl text-white/40">{currency.symbol}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-white/70 text-sm">Rate (vs USD)</span>
                  <span className="text-white font-semibold">{currency.rate.toFixed(4)}</span>
                </div>

                <div className={`flex items-center gap-2 text-sm font-bold ${currency.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currency.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {currency.changePercent >= 0 ? '+' : ''}{currency.changePercent.toFixed(2)}%
                </div>
              </div>

              {/* Quick Convert */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-white/50 text-xs mb-1">100 USD =</p>
                <p className="text-white font-semibold">
                  {(100 * currency.rate).toFixed(2)} {currency.code}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-white/60 text-sm">
            Exchange rates are updated every 5 seconds. Data is for informational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
