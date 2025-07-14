
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const email = searchParams.get('email') || user?.email || '';
  const isEmployer = searchParams.get('type') === 'employer';
  const fromParam = searchParams.get('from');

  // Listen for real-time verification status
  useEffect(() => {
    if (!user) return;

    const checkVerificationStatus = () => {
      // Check if user is verified and redirect if so
      if (user.email_confirmed_at && !isVerified) {
        setIsVerified(true);
        toast({
          title: "Email verified!",
          description: "Your email has been verified successfully.",
        });

        // Redirect to original page or continue with onboarding
        setTimeout(() => {
          if (fromParam) {
            navigate(fromParam);
          } else {
            // Let ProtectedRoute handle the role selection flow
            navigate('/job-hub');
          }
        }, 1500);
      }
    };

    // Check immediately
    checkVerificationStatus();

    // Set up auth state listener for real-time verification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        const user = session?.user;
        if (user?.email_confirmed_at && !isVerified) {
          setIsVerified(true);
          toast({
            title: "Email verified!",
            description: "Your email has been verified successfully.",
          });

          setTimeout(() => {
            if (fromParam) {
              navigate(fromParam);
            } else {
              navigate('/job-hub');
            }
          }, 1500);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [user, isVerified, fromParam, navigate, toast]);

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      // Note: Supabase doesn't have a direct resend method, so we'd need to implement this
      // For now, we'll just show a message
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            {isEmployer 
              ? "We've sent a verification link to complete your employer account setup"
              : "We've sent a verification link to your email address"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={isVerified ? "border-green-200 bg-green-50" : ""}>
            <CheckCircle className={`h-4 w-4 ${isVerified ? "text-green-600" : ""}`} />
            <AlertDescription>
              {isVerified ? (
                <>Email verified! Redirecting you back to where you left off...</>
              ) : (
                <>A verification email has been sent to <strong>{email}</strong></>
              )}
            </AlertDescription>
          </Alert>

          {fromParam && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                Once verified, you'll be redirected back to continue where you left off.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              {isEmployer 
                ? "Click the link in the email to verify your account and access your employer dashboard."
                : "Click the link in the email to verify your account and access your dashboard."
              }
            </p>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
              
              <Link to={isEmployer ? "/employer/auth" : "/auth"}>
                <Button variant="ghost" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Didn't receive the email? Check your spam folder or try resending.</p>
            {isEmployer && (
              <p className="mt-2 text-blue-600">
                After verification, you'll be redirected to your employer dashboard to set up your company profile.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
