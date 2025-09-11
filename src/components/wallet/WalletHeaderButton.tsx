import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wallet } from 'lucide-react';
import { useWalletContext } from '@/contexts/WalletContext';
import { WalletHeaderPopover } from './WalletHeaderPopover';

export const WalletHeaderButton: React.FC = () => {
  try {
    const { isConnected, tokenBalance } = useWalletContext();

    const hasWalletPremium = isConnected && tokenBalance !== null && tokenBalance >= 10000;

    return (
      <Popover>
        <PopoverTrigger asChild>
          {isConnected ? (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <Wallet className={`h-3 w-3 ${hasWalletPremium ? 'text-green-300' : 'text-blue-300'}`} />
              <span className="text-xs font-medium">
                {hasWalletPremium ? 'Premium' : 'Connected'}
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <Wallet className="h-3 w-3 text-gray-300" />
              <span className="text-xs font-medium">Connect Wallet</span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <WalletHeaderPopover />
        </PopoverContent>
      </Popover>
    );
  } catch (error) {
    console.error('WalletHeaderButton error:', error);
    // Fallback UI if wallet context fails
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 text-white hover:bg-white/20 hover:text-white"
      >
        <Wallet className="h-3 w-3 text-gray-300" />
        <span className="text-xs font-medium">Connect Wallet</span>
      </Button>
    );
  }
};