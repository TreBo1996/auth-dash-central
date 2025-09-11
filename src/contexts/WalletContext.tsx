import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  WalletAdapterNetwork,
  WalletError,
  WalletNotConnectedError 
} from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
  WalletDisconnectButton
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { clusterApiUrl } from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextType {
  isConnected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  verifyTokens: (role: 'seeker' | 'employer') => Promise<boolean>;
  tokenBalance: number | null;
  isVerifying: boolean;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderWrapperProps {
  children: ReactNode;
}

// Inner component that uses wallet hooks
const WalletContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey, connected, connecting, disconnect, signMessage } = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check token balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkTokenBalance();
    } else {
      setTokenBalance(null);
    }
  }, [connected, publicKey]);

  const checkTokenBalance = async () => {
    if (!publicKey) return;

    try {
      const tokenMint = import.meta.env.VITE_REZLIT_TOKEN_MINT;
      if (!tokenMint || tokenMint === 'REPLACE_ME_MINT_ADDRESS') {
        console.log('Token mint not configured, setting balance to 0');
        setTokenBalance(0);
        return;
      }

      const tokenMintPubkey = new PublicKey(tokenMint);
      const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
        mint: tokenMintPubkey
      });

      if (tokenAccounts.value.length > 0) {
        const accountInfo = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
        setTokenBalance(accountInfo.value.uiAmount || 0);
      } else {
        setTokenBalance(0);
      }
    } catch (error) {
      console.error('Error checking token balance:', error);
      setTokenBalance(0);
    }
  };

  const verifyTokens = async (role: 'seeker' | 'employer'): Promise<boolean> => {
    if (!connected || !publicKey || !user) {
      toast.error('Please connect your wallet and sign in first');
      return false;
    }

    setIsVerifying(true);

    try {
      // Create a message to sign for verification
      const message = `Verify wallet ownership for RezLit premium access as ${role}. Timestamp: ${Date.now()}`;
      
      // Check if wallet supports message signing
      if (!signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureBase64 = btoa(String.fromCharCode(...signature));

      // Call verification function
      const { data, error } = await supabase.functions.invoke('verify-solana-tokens', {
        body: {
          walletAddress: publicKey.toString(),
          role,
          signature: signatureBase64,
          message
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && data.hasEnoughTokens) {
        toast.success(`Premium access granted! You have ${data.tokenBalance} tokens.`);
        return true;
      } else {
        toast.error(`Insufficient tokens. You have ${data.tokenBalance}, but need ${data.requiredBalance} tokens for ${role} premium access.`);
        return false;
      }

    } catch (error: any) {
      console.error('Token verification error:', error);
      toast.error(`Verification failed: ${error.message}`);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const contextValue: WalletContextType = {
    isConnected: connected,
    publicKey,
    connecting,
    verifyTokens,
    tokenBalance,
    isVerifying,
    disconnect
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Main wrapper component with all providers
export const WalletProviderWrapper: React.FC<WalletProviderWrapperProps> = ({ children }) => {
  // Configure which wallets to support (ordered by popularity)
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
    new CoinbaseWalletAdapter(),
    new WalletConnectWalletAdapter({
      network: WalletAdapterNetwork.Mainnet,
      options: {
        projectId: '4fbb552f9d9e5e1e2e7b6b4c4c4c4c4c', // Replace with your WalletConnect project ID
      },
    }),
    new TrustWalletAdapter()
  ];

  // Use mainnet for production
  const endpoint = clusterApiUrl(WalletAdapterNetwork.Mainnet);

  const onError = (error: WalletError) => {
    console.error('Wallet error:', error);
    toast.error(`Wallet error: ${error.message}`);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProviderWrapper');
  }
  return context;
};

// Export wallet components for use in UI
export { WalletMultiButton, WalletDisconnectButton };