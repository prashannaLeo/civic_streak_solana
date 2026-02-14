import React, { useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// Import wallet styles
import "@solana/wallet-adapter-react-ui/styles.css";

// Get API key from env
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY?.trim() || "";

// Use devnet URLs
const getHeliusUrl = (key: string) => `https://devnet.helius-rpc.com/?api-key=${key}`;

// RPC endpoints - devnet only
const RPC_ENDPOINTS = [
  // Helius devnet
  HELIUS_API_KEY ? getHeliusUrl(HELIUS_API_KEY) : null,
  // AllThatNode devnet
  "https://solana-devnet-rpc.allthatnode.com",
  // Solana public devnet
  "https://api.devnet.solana.com",
].filter(Boolean) as string[];

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({
  children,
}: WalletContextProviderProps) => {
  const [endpoint, setEndpoint] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Test each RPC and find working one
  useEffect(() => {
    const findWorkingEndpoint = async () => {
      console.log("🔍 Finding working devnet RPC...");
      
      for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
        const rpc = RPC_ENDPOINTS[i];
        const label = rpc.includes("helius") ? "Helius" : rpc.includes("allthatnode") ? "AllThatNode" : "Solana";
        
        try {
          console.log(`Testing ${label} (${i + 1}/${RPC_ENDPOINTS.length})...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          // Use getVersion
          const response = await fetch(rpc, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "getVersion",
              params: [],
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.result && (data.result["solana-core"] || data.result.version)) {
              console.log(`✅ ${label} works! Using:`, rpc.substring(0, 50));
              setEndpoint(rpc);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log(`❌ ${label} failed`);
        }
      }
      
      // Fallback
      console.log("Using fallback: api.devnet.solana.com");
      setEndpoint("https://api.devnet.solana.com");
      setLoading(false);
    };

    findWorkingEndpoint();
  }, []);

  // Only use Solflare to avoid Phantom conflicts
  // Phantom has known issues with some domains
  const wallets = useMemo(() => {
    return [
      new SolflareWalletAdapter(),
    ];
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "#0a0a0f",
        color: "#667eea",
        gap: "12px"
      }}>
        <div style={{ fontSize: "32px" }}>🔄</div>
        <div>Connecting to Solana Devnet...</div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Make sure Phantom is set to Devnet mode
        </div>
      </div>
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error: Error) => {
          console.error("Wallet error:", error);
          alert("Wallet error: " + error.message);
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
