import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, ExternalLink, Copy, CheckCircle2, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const WALLETS = [
  { id: "metamask", name: "MetaMask", icon: "🦊", description: "Connect using browser extension", popular: true },
  { id: "walletconnect", name: "WalletConnect", icon: "🔗", description: "Scan QR code with mobile wallet" },
  { id: "coinbase", name: "Coinbase Wallet", icon: "🔵", description: "Connect Coinbase Wallet" },
  { id: "phantom", name: "Phantom", icon: "👻", description: "Solana & multi-chain wallet" },
  { id: "ledger", name: "Ledger", icon: "🔒", description: "Hardware wallet — maximum security" },
];

export function WalletConnectButton() {
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<{ wallet: string; address: string; balance: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId);
    // In production this would call window.ethereum.request({ method: 'eth_requestAccounts' })
    // For now, show a placeholder address until real Web3 provider is injected
    await new Promise(r => setTimeout(r, 1800));
    const placeholderAddress = "0x0000000000000000000000000000000000000000";
    setConnected({ wallet: walletId, address: placeholderAddress, balance: "Connect real wallet to see balance" });
    setConnecting(null);
    setOpen(false);
    toast.success("Wallet UI connected — link your real wallet to see live balance");
  };

  const handleCopy = () => {
    if (connected) {
      navigator.clipboard.writeText(connected.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Address copied!");
    }
  };

  const handleDisconnect = () => {
    setConnected(null);
    setShowDropdown(false);
    toast.info("Wallet disconnected");
  };

  const shortAddress = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

  if (connected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600/10 border border-purple-500/30 hover:border-purple-500/50 transition-all text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          <span className="text-purple-400 font-mono font-medium">{shortAddress(connected.address)}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 w-64 p-3">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
              <p className="font-mono text-sm text-foreground">{shortAddress(connected.address)}</p>
              <p className="text-xs text-purple-400 mt-0.5">{connected.balance}</p>
            </div>
            <div className="space-y-1">
              <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-sm transition-colors">
                {copied ? <CheckCircle2 className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Address"}
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-sm transition-colors">
                <ExternalLink className="w-4 h-4" /> View on Explorer
              </button>
              <button onClick={handleDisconnect} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-400 transition-colors">
                <LogOut className="w-4 h-4" /> Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 border-primary/30 hover:border-primary/60">
        <Wallet className="w-4 h-4" /> Connect Wallet
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Connect Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {WALLETS.map(w => (
              <button
                key={w.id}
                onClick={() => handleConnect(w.id)}
                disabled={!!connecting}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
              >
                <span className="text-2xl">{w.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{w.name}</span>
                    {w.popular && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary py-0">Popular</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{w.description}</p>
                </div>
                {connecting === w.id ? (
                  <span className="text-xs text-primary animate-pulse">Connecting...</span>
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg] group-hover:text-primary transition-colors" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            By connecting, you agree to our Terms of Service
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
