import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, X } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  returnUrl
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createCheckout, refreshSubscription } = useSubscription();

  const handleStartCheckout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const checkoutUrl = await createCheckout(returnUrl);
      if (checkoutUrl) {
        // Open Stripe checkout in the same window but handle return
        window.location.href = checkoutUrl;
      } else {
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Unlock Premium Features</h3>
            <p className="text-muted-foreground">
              Get unlimited access to all features for just $19.99/month
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Premium includes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited resume optimizations</li>
              <li>• Unlimited interview sessions</li>
              <li>• Unlimited cover letters</li>
              <li>• Priority support</li>
            </ul>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartCheckout}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};