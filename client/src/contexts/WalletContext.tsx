// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (to: string, amount: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            await connectWallet(accounts[0]);
          }
        } catch (error) {
                  }
      }
    };
    checkConnection();
  }, []);

  const connectWallet = async (account?: string) => {
    if (!window.ethereum) {
      alert("MetaMask not installed. Please install MetaMask to continue.");
      return;
    }

    try {
      const accounts = account
        ? [account]
        : await (window as any).ethereum.request({ method: "eth_requestAccounts" });

      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      const userAddress = accounts[0];

      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(userAddress);
      setIsConnected(true);

      // Get balance
      const balanceWei = await newProvider.getBalance(userAddress);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(balanceEth);

      // Listen for account changes
      (window as any).ethereum.on("accountsChanged", (newAccounts: string[]) => {
        if (newAccounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet(newAccounts[0]);
        }
      });

      // Listen for network changes
      (window as any).ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
          }
  };

  const connect = async () => {
    await connectWallet();
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
  };

  const disconnect = () => {
    disconnectWallet();
  };

  const sendTransaction = async (to: string, amount: string): Promise<string | null> => {
    if (!signer || !provider) return null;

    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      const receipt = await tx.wait();
      return receipt?.hash || null;
    } catch (error) {
            return null;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected,
        provider,
        signer,
        connect,
        disconnect,
        sendTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
