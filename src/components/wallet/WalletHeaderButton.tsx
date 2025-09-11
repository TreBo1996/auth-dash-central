import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wallet } from 'lucide-react';
import { useWalletContext } from '@/contexts/WalletContext';
import { WalletHeaderPopover } from './WalletHeaderPopover';

interface WalletHeaderButtonProps {
  variant?: 'header' | 'sidebar';
}

export const WalletHeaderButton: React.FC<WalletHeaderButtonProps> = ({ variant = 'header' }) => {
  try {
    const { isConnected, tokenBalance } = useWalletContext();

    const hasWalletPremium = isConnected && tokenBalance !== null && tokenBalance >= 10000;

    const getButtonStyles = () => {
      if (variant === 'sidebar') {
        return {
          variant: 'outline' as const,
          size: 'default' as const,
          className: isConnected 
            ? "w-full justify-start h-11 border-indigo-200 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 hover:border-green-200 transition-all duration-200"
            : "w-full justify-start h-11 border-indigo-200 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:border-blue-200 transition-all duration-200"
        };
      }
      
      // Header variant (original styling)
      return {
        variant: 'ghost' as const,
        size: 'sm' as const,
        className: "flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 text-white hover:bg-white/20 hover:text-white"
      };
    };

    const getIconStyles = () => {
      if (variant === 'sidebar') {
        return `mr-3 h-4 w-4 ${isConnected 
          ? (hasWalletPremium ? 'text-green-600' : 'text-blue-600')
          : 'text-gray-500'
        }`;
      }
      
      // Header variant (original styling)
      return `h-3 w-3 ${isConnected 
        ? (hasWalletPremium ? 'text-green-300' : 'text-blue-300')
        : 'text-gray-300'
      }`;
    };

    const getTextContent = () => {
      if (variant === 'sidebar') {
        return isConnected 
          ? (hasWalletPremium ? 'Wallet Premium' : 'Wallet Connected')
          : 'Connect Wallet';
      }
      
      // Header variant (original text)
      return isConnected 
        ? (hasWalletPremium ? 'Premium' : 'Connected')
        : 'Connect Wallet';
    };

    const getTextStyles = () => {
      return variant === 'sidebar' ? "text-sm font-medium" : "text-xs font-medium";
    };

    const buttonStyles = getButtonStyles();

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={buttonStyles.variant}
            size={buttonStyles.size}
            className={buttonStyles.className}
          >
            <Wallet className={getIconStyles()} />
            <span className={getTextStyles()}>
              {getTextContent()}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align={variant === 'sidebar' ? 'start' : 'end'}>
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