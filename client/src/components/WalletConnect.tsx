import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnect() {
  const { address, balance, isConnected, connect, disconnect } = useWallet();

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-blue-400" />
          {isConnected ? (
            <div>
              <p className="text-sm text-gray-400">Connected Wallet</p>
              <p className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p className="text-xs text-purple-400 mt-1">Balance: {balance} ETH</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400">No Wallet Connected</p>
              <p className="text-xs text-gray-500">Connect MetaMask to start mining</p>
            </div>
          )}
        </div>

        {isConnected ? (
          <Button
            onClick={disconnect}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </Button>
        ) : (
          <Button
            onClick={connect}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </Card>
  );
}
