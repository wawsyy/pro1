"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { injected } from "wagmi/connectors";

import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { WalletProvider } from "@/hooks/useWalletContext";

type Props = {
  children: ReactNode;
};

const chains = [sepolia, hardhat] as const;

const connectors = [
  injected({
    shimDisconnect: true,
  }),
];

const wagmiConfig = createConfig({
  chains,
  transports: {
    [sepolia.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  connectors,
  ssr: true,
});

const mockChains = {
  31337: "http://127.0.0.1:8545",
} as const;

export function Providers({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#5C4EE5",
            accentColorForeground: "#FFFFFF",
            borderRadius: "medium",
            fontStack: "rounded",
          })}
        >
          <WalletProvider mockChains={mockChains}>
            <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
          </WalletProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
