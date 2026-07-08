import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ChevronDown, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const TOKENS = [
  { symbol: "SKY444", name: "SKYCOIN4444", price: 0.0847, color: "text-purple-400", bg: "bg-purple-600/10" },
  { symbol: "BTC", name: "Bitcoin", price: 105420, color: "text-orange-400", bg: "bg-orange-500/10" },
  { symbol: "ETH", name: "Ethereum", price: 3820, color: "text-purple-400", bg: "bg-purple-500/10" },
  { symbol: "SOL", name: "Solana", price: 178, color: "text-blue-400", bg: "bg-blue-500/10" },
  { symbol: "USDC", name: "USD Coin", price: 1.0, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { symbol: "BNB", name: "BNB", price: 712, color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0];

export function TokenSwapWidget() {
  const [fromToken, setFromToken] = useState(TOKENS[2]); // ETH
  const [toToken, setToToken] = useState(TOKENS[0]); // SKY444
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showFromSelect, setShowFromSelect] = useState(false);
  const [showToSelect, setShowToSelect] = useState(false);

  const toAmount = fromAmount
    ? ((parseFloat(fromAmount) * fromToken.price) / toToken.price).toFixed(6)
    : "";

  const priceImpact = fromAmount ? Math.min(parseFloat(fromAmount) * 0.001, 5).toFixed(2) : "0.00";
  const minReceived = toAmount ? (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6) : "0";
  const networkFee = fromToken.symbol === "ETH" ? "~$4.20" : fromToken.symbol === "BTC" ? "~$8.50" : "~$0.12";

  const handleSwapTokens = () => {
    const tmp = fromToken;
    setFromToken(toToken);
    setToToken(tmp);
    setFromAmount(toAmount);
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error("Enter an amount to swap");
      return;
    }
    setIsSwapping(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSwapping(false);
    toast.success(`Swapped ${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`);
    setFromAmount("");
  };

  return (
    <Card className="p-5 border-border/50 bg-card/90 backdrop-blur max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Token Swap
        </h3>
        <div className="flex items-center gap-1">
          {SLIPPAGE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              className={`text-xs px-2 py-0.5 rounded-full transition-all ${slippage === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      {/* From */}
      <div className="bg-background/60 rounded-xl p-4 mb-1 border border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">You Pay</span>
          <span className="text-xs text-muted-foreground">Balance: 2.4851</span>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={e => setFromAmount(e.target.value)}
            className="border-0 bg-transparent text-2xl font-bold p-0 h-auto focus-visible:ring-0 w-full"
          />
          <div className="relative">
            <button
              onClick={() => { setShowFromSelect(!showFromSelect); setShowToSelect(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${fromToken.bg} border border-border/30 hover:border-primary/30 transition-all whitespace-nowrap`}
            >
              <span className={`font-bold text-sm ${fromToken.color}`}>{fromToken.symbol}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {showFromSelect && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 w-48 overflow-hidden">
                {TOKENS.filter(t => t.symbol !== toToken.symbol).map(t => (
                  <button key={t.symbol} onClick={() => { setFromToken(t); setShowFromSelect(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors text-left">
                    <span className={`font-semibold text-sm ${t.color}`}>{t.symbol}</span>
                    <span className="text-xs text-muted-foreground">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {fromAmount && (
          <p className="text-xs text-muted-foreground mt-1">≈ ${(parseFloat(fromAmount) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        )}
      </div>

      {/* Swap button */}
      <div className="flex justify-center my-1">
        <button onClick={handleSwapTokens}
          className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-all hover:rotate-180 duration-300">
          <ArrowUpDown className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* To */}
      <div className="bg-background/60 rounded-xl p-4 mb-4 border border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">You Receive</span>
          <span className="text-xs text-muted-foreground">Balance: 12,450</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-purple-400 flex-1">{toAmount || "0.0"}</div>
          <div className="relative">
            <button
              onClick={() => { setShowToSelect(!showToSelect); setShowFromSelect(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${toToken.bg} border border-border/30 hover:border-primary/30 transition-all whitespace-nowrap`}
            >
              <span className={`font-bold text-sm ${toToken.color}`}>{toToken.symbol}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {showToSelect && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 w-48 overflow-hidden">
                {TOKENS.filter(t => t.symbol !== fromToken.symbol).map(t => (
                  <button key={t.symbol} onClick={() => { setToToken(t); setShowToSelect(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors text-left">
                    <span className={`font-semibold text-sm ${t.color}`}>{t.symbol}</span>
                    <span className="text-xs text-muted-foreground">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {toAmount && (
          <p className="text-xs text-muted-foreground mt-1">≈ ${(parseFloat(toAmount) * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        )}
      </div>

      {/* Quote details */}
      {fromAmount && parseFloat(fromAmount) > 0 && (
        <div className="bg-background/40 rounded-lg p-3 mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Rate</span>
            <span className="text-foreground">1 {fromToken.symbol} = {(fromToken.price / toToken.price).toFixed(4)} {toToken.symbol}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Price Impact</span>
            <span className={parseFloat(priceImpact) > 2 ? "text-red-400" : "text-purple-400"}>{priceImpact}%</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Min. Received ({slippage}% slippage)</span>
            <span className="text-foreground">{minReceived} {toToken.symbol}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Network Fee</span>
            <span className="text-foreground">{networkFee}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full bg-primary hover:bg-primary/90 font-bold"
        onClick={handleSwap}
        disabled={isSwapping || !fromAmount}
      >
        {isSwapping ? (
          <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Swapping...</span>
        ) : !fromAmount ? (
          "Enter Amount"
        ) : (
          <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Swap {fromToken.symbol} → {toToken.symbol}</span>
        )}
      </Button>

      <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
        <CheckCircle2 className="w-3 h-3 text-purple-400" />
        <span>Powered by SKY444 DEX · Best price routing</span>
      </div>
    </Card>
  );
}
