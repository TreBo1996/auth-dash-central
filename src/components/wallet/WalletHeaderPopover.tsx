import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useWalletContext, WalletMultiButton } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const WalletHeaderPopover: React.FC = () => {
  const { isConnected, publicKey, tokenBalance, verifyTokens, isVerifying } = useWalletContext();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'employer' | null>(null);

  const handleRoleSelection = async (role: 'seeker' | 'employer') => {
    if (!isConnected || !user) return;
    
    setSelectedRole(role);
    const success = await verifyTokens(role);
    
    if (success) {
      toast.success(`Premium access granted for ${role}!`);
    }
    setSelectedRole(null);
  };

  const getRoleRequirement = (role: 'seeker' | 'employer') => {
    return role === 'seeker' ? '10,000' : '50,000';
  };

  const canAffordRole = (role: 'seeker' | 'employer') => {
    if (!tokenBalance) return false;
    const requirement = role === 'seeker' ? 10000 : 50000;
    return tokenBalance >= requirement;
  };

  if (!user) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Wallet Connection</CardTitle>
          <CardDescription className="text-sm">
            Please sign in to connect your wallet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Wallet Connection
        </CardTitle>
        <CardDescription className="text-sm">
          Connect your Solana wallet for premium access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Solana wallet to unlock premium features with RezLit tokens
            </p>
            <WalletMultiButton />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Wallet Connected</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </p>
              {tokenBalance !== null && (
                <p className="text-sm">
                  <span className="font-medium">RezLit Tokens:</span> {tokenBalance.toLocaleString()}
                </p>
              )}
            </div>

            {/* Premium Access Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Premium Access</h4>
              <div className="grid gap-2">
                {/* Job Seeker Premium */}
                <Button
                  variant={canAffordRole('seeker') ? 'default' : 'outline'}
                  size="sm"
                  className="justify-between h-auto p-3"
                  onClick={() => handleRoleSelection('seeker')}
                  disabled={isVerifying || selectedRole === 'seeker'}
                >
                  <div className="text-left">
                    <div className="font-medium text-xs">Job Seeker Premium</div>
                    <div className="text-xs opacity-75">{getRoleRequirement('seeker')} tokens required</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isVerifying && selectedRole === 'seeker' ? (
                      <Clock className="h-3 w-3 animate-spin" />
                    ) : canAffordRole('seeker') ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </Button>

                {/* Employer Premium */}
                <Button
                  variant={canAffordRole('employer') ? 'default' : 'outline'}
                  size="sm"
                  className="justify-between h-auto p-3"
                  onClick={() => handleRoleSelection('employer')}
                  disabled={isVerifying || selectedRole === 'employer'}
                >
                  <div className="text-left">
                    <div className="font-medium text-xs">Employer Premium</div>
                    <div className="text-xs opacity-75">{getRoleRequirement('employer')} tokens required</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isVerifying && selectedRole === 'employer' ? (
                      <Clock className="h-3 w-3 animate-spin" />
                    ) : canAffordRole('employer') ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};