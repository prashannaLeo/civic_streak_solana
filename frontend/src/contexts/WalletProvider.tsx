import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CloverWalletAdapter,
  BitKeepWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({
  children,
}: WalletContextProviderProps) => {
  const network = (import.meta.env.VITE_SOLANA_NETWORK || "devnet") as any;
  const endpoint = useMemo(
    () => import.meta.env.VITE_SOLANA_RPC_ENDPOINT || clusterApiUrl(network),
    [network],
  );

  const wallets = useMemo(() => {
    return [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CloverWalletAdapter(),
      new BitKeepWalletAdapter(),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter(),
    ];
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={true}
        onError={(error: Error) => {
          console.error("Wallet error:", error);
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
