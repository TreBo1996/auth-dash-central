import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletMultiButton } from '@/contexts/WalletContext';
import { useWalletContext } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Crown, Users, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletSignInProps {
  onSuccess?: () => void;
}

export const WalletSignIn: React.FC<WalletSignInProps> = ({ onSuccess }) => {
  const { isConnected, publicKey, tokenBalance, verifyTokens, isVerifying } = useWalletContext();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'employer' | null>(null);

  const handleRoleSelection = async (role: 'seeker' | 'employer') => {
    if (!isConnected || !user) {
      toast.error('Please connect your wallet and sign in first');
      return;
    }

    setSelectedRole(role);
    
    const success = await verifyTokens(role);
    if (success && onSuccess) {
      onSuccess();
    }
    
    setSelectedRole(null);
  };

  const getRoleRequirement = (role: 'seeker' | 'employer') => {
    return role === 'seeker' ? '10,000' : '100,000';
  };

  const canAffordRole = (role: 'seeker' | 'employer') => {
    if (tokenBalance === null) return false;
    const required = role === 'seeker' ? 10000 : 100000;
    return tokenBalance >= required;
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in with your email first, then connect your Solana wallet for premium access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Solana Wallet Premium Access</CardTitle>
        <CardDescription>
          Connect your Solana wallet and verify token ownership for premium features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Connect your Solana wallet to get started:
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connected:</span>
                <span className="font-mono text-xs">
                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </span>
              </div>
              {tokenBalance !== null && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Token Balance:</span>
                  <span className="font-semibold">{tokenBalance.toLocaleString()} tokens</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Choose your role and verify token requirements:
              </p>

              <div className="grid gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleRoleSelection('seeker')}
                  disabled={isVerifying || selectedRole === 'seeker'}
                  className="h-auto p-4 text-left flex items-start gap-3"
                >
                  {selectedRole === 'seeker' ? (
                    <Loader2 className="h-5 w-5 animate-spin mt-0.5" />
                  ) : (
                    <Users className="h-5 w-5 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Job Seeker Premium</span>
                      {canAffordRole('seeker') ? (
                        <Badge variant="default" className="bg-green-500">✓ Qualified</Badge>
                      ) : (
                        <Badge variant="secondary">Need More Tokens</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requires {getRoleRequirement('seeker')} tokens
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleRoleSelection('employer')}
                  disabled={isVerifying || selectedRole === 'employer'}
                  className="h-auto p-4 text-left flex items-start gap-3"
                >
                  {selectedRole === 'employer' ? (
                    <Loader2 className="h-5 w-5 animate-spin mt-0.5" />
                  ) : (
                    <Building2 className="h-5 w-5 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Employer Premium</span>
                      {canAffordRole('employer') ? (
                        <Badge variant="default" className="bg-green-500">✓ Qualified</Badge>
                      ) : (
                        <Badge variant="secondary">Need More Tokens</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requires {getRoleRequirement('employer')} tokens
                    </p>
                  </div>
                </Button>
              </div>

              {tokenBalance !== null && tokenBalance < 10000 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Insufficient tokens:</strong> You need at least 10,000 tokens for Job Seeker premium or 100,000 tokens for Employer premium.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-3 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Don't have tokens? You can still use email/password with Stripe subscriptions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};