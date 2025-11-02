
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import '@solana/wallet-adapter-react-ui/styles.css';
  import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
  import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
  import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
  import { useMemo } from 'react';

  function Root() {
    const endpoint = 'https://api.devnet.solana.com';
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <App />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  }

  createRoot(document.getElementById("root")!).render(<Root />);
  
