import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletMultiButton, WalletDisconnectButton } from '@/contexts/WalletContext';
import { useWalletContext } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Crown, Users, Building2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const WalletConnectCard: React.FC = () => {
  const { isConnected, publicKey, tokenBalance, verifyTokens, isVerifying } = useWalletContext();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'employer' | null>(null);

  const handleRoleSelection = async (role: 'seeker' | 'employer') => {
    if (!isConnected || !user) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSelectedRole(role);
    
    const success = await verifyTokens(role);
    if (success) {
      toast.success(`Premium access granted via Solana wallet!`);
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

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Wallet className={`h-5 w-5 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
          <CardTitle className="text-lg">Solana Wallet Premium</CardTitle>
        </div>
        <CardDescription>
          Connect your Solana wallet to unlock premium features with token verification
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
            </span>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          )}
        </div>

        {/* Wallet Details */}
        {isConnected && publicKey && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wallet Address:</span>
              <span className="font-mono text-xs">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </span>
            </div>
            {tokenBalance !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Token Balance:</span>
                <span className="font-semibold">{tokenBalance.toLocaleString()} tokens</span>
              </div>
            )}
          </div>
        )}

        {/* Connection Actions */}
        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Connect your Solana wallet to verify token ownership:
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Verify Premium Access:</p>
              
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
            </div>

            {/* Insufficient Tokens Warning */}
            {tokenBalance !== null && tokenBalance < 10000 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Insufficient tokens:</strong> You need at least 10,000 tokens for Job Seeker premium or 100,000 tokens for Employer premium.
                </p>
              </div>
            )}

            {/* Disconnect Option */}
            <div className="pt-2 border-t">
              <WalletDisconnectButton />
            </div>
          </div>
        )}

        {/* Alternative Option */}
        <div className="pt-3 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Alternative: Use Stripe subscription for premium access without tokens
          </p>
        </div>
      </CardContent>
    </Card>
  );
};