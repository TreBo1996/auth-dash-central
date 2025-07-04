import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Check, ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

const stripePromise = loadStripe('pk_test_51QWJbkCv1tCFgWNaavOIGJzUdSzM6s6nRLIpEUOKTWF6VhOQhHk5Qfb7jBDnCBvJOO5bInEGzFhWqUlJhLzVo8Qk00YgxJowOa');

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: 'hsl(222.2 84% 4.9%)',
      fontFamily: 'Inter, Helvetica Neue, Helvetica, Arial, sans-serif',
      '::placeholder': {
        color: 'hsl(215.4 16.3% 46.9%)',
      },
    },
    invalid: {
      color: 'hsl(0 84.2% 60.2%)',
    },
  },
  hidePostalCode: false,
};

const PaymentForm: React.FC<{ returnUrl: string }> = ({ returnUrl }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { createCheckout, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, we'll still use the hosted checkout but in the future
      // this could be replaced with direct payment processing
      const checkoutUrl = await createCheckout(returnUrl);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(returnUrl || '/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-4 border">
          <CardElement options={cardElementOptions} />
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={loading}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-gradient-primary hover:opacity-90"
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
    </form>
  );
};

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-light p-4">
      <div className="max-w-md mx-auto pt-8">
        <Card className="border-2 border-blue-200/50 shadow-xl-modern">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Upgrade to Premium
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Get unlimited access to all features for just $19.99/month
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Premium Plan
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gradient-card rounded-lg p-4 space-y-3 border">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Premium includes:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                  Unlimited resume optimizations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                  Unlimited interview sessions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                  Unlimited cover letters
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                  Priority support
                </li>
              </ul>
            </div>

            <div className="bg-gradient-accent/10 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-gray-800">$19.99/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cancel anytime • Secure payment
              </p>
            </div>

            <Elements stripe={stripePromise}>
              <PaymentForm returnUrl={returnUrl} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;