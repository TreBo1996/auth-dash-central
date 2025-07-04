import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

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

  const handleStartCheckout = () => {
    // Navigate to dedicated payment page
    const currentUrl = window.location.href;
    const paymentUrl = `/payment?returnUrl=${encodeURIComponent(returnUrl || currentUrl)}`;
    window.location.href = paymentUrl;
  };

  const handleClose = () => {
    onClose();
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartCheckout}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};