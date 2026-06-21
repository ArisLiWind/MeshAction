"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { useState, type ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

const { networkConfig } = createNetworkConfig({
  testnet: {
    network: "testnet",
    url: getJsonRpcFullnodeUrl("testnet"),
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider
          autoConnect
          preferredWallets={["Slush", "Sui Wallet"]}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
