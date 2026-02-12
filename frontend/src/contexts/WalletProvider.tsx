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

  // Check if Phantom is available (injected by the extension)
  const hasInjectedPhantom =
    typeof window !== "undefined" && window.solana?.isPhantom;

  const wallets = useMemo(() => {
    const walletList = [];

    // Only add Phantom wallet adapter if Phantom is detected
    if (hasInjectedPhantom) {
      walletList.push(
        new PhantomWalletAdapter({
          appUrl: window.location.origin,
        }),
      );
    }

    // Always add other wallet adapters
    walletList.push(
      new SolflareWalletAdapter(),
      new CloverWalletAdapter(),
      new BitKeepWalletAdapter(),
      new LedgerWalletAdapter(),
    );

    return walletList;
  }, [hasInjectedPhantom]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error: Error) => {
          console.error("Wallet error:", error);
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
