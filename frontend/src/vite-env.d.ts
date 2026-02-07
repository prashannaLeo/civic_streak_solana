/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_NETWORK: string;
  readonly VITE_SOLANA_RPC_ENDPOINT: string;
  readonly VITE_CIVIC_STREAK_PROGRAM_ID: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
