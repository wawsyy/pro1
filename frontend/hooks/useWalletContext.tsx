"use client";

import { useEffect, useMemo, useRef, useState, ReactNode, createContext, useContext } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";

type MockChainMap = Readonly<Record<number, string>>;

type WalletContextValue = {
  account: `0x${string}` | undefined;
  chainId: number | undefined;
  provider: ethers.Eip1193Provider | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  isConnected: boolean;
  initialMockChains: MockChainMap | undefined;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

type WalletProviderProps = {
  children: ReactNode;
  mockChains?: MockChainMap;
};

export function WalletProvider({ children, mockChains }: WalletProviderProps) {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [readonlyProvider, setReadonlyProvider] = useState<ethers.ContractRunner | undefined>(undefined);

  const currentChainRef = useRef<number | undefined>(chainId);

  useEffect(() => {
    currentChainRef.current = chainId;
  }, [chainId]);

  useEffect(() => {
    let cancelled = false;

    async function syncProviders() {
      if (!walletClient || !isConnected || !chainId || !address) {
        setProvider(undefined);
        setBrowserProvider(undefined);
        setSigner(undefined);
        setReadonlyProvider(undefined);
        return;
      }

      const eip1193 = walletClient as unknown as ethers.Eip1193Provider;
      setProvider(eip1193);

      try {
        const browser = new ethers.BrowserProvider(eip1193, chainId);
        const signerInstance = await browser.getSigner(walletClient.account.address as `0x${string}`);
        if (cancelled) {
          return;
        }

        setBrowserProvider(browser);
        setSigner(signerInstance);

        const rpcUrl = mockChains?.[chainId];
        if (rpcUrl) {
          setReadonlyProvider(new ethers.JsonRpcProvider(rpcUrl));
        } else {
          setReadonlyProvider(browser);
        }
      } catch (error) {
        console.error("[WalletProvider] Unable to initialize ethers providers", error);
        if (!cancelled) {
          setBrowserProvider(undefined);
          setSigner(undefined);
          setReadonlyProvider(undefined);
        }
      }
    }

    syncProviders();

    return () => {
      cancelled = true;
    };
  }, [walletClient, isConnected, chainId, address, mockChains]);

  const value = useMemo<WalletContextValue>(
    () => ({
      account: address as `0x${string}` | undefined,
      chainId,
      provider,
      ethersSigner: signer,
      ethersReadonlyProvider: readonlyProvider,
      isConnected,
      initialMockChains: mockChains,
    }),
    [address, chainId, provider, signer, readonlyProvider, isConnected, mockChains],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}

