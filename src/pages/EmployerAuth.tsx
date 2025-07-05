
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Mail, Lock, User, ArrowLeft, Briefcase, Clock, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { supabase } from '@/integrations/supabase/client';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const EmployerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetting, setCaptchaResetting] = useState(false);
  const [captchaTokenTimestamp, setCaptchaTokenTimestamp] = useState<number | null>(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const captchaRef = useRef<HCaptcha>(null);
  const rateLimit = useAuthRateLimit();

  // Check if captcha token is fresh (not older than 5 minutes)
  const isCaptchaTokenFresh = () => {
    if (!captchaTokenTimestamp) return false;
    const tokenAge = Date.now() - captchaTokenTimestamp;
    return tokenAge < 5 * 60 * 1000; // 5 minutes
  };

  // Enhanced captcha reset function with better error handling
  const resetCaptcha = async () => {
    setCaptchaResetting(true);
    setCaptchaToken(null);
    setCaptchaTokenTimestamp(null);
    
    // Wait longer for hCaptcha to fully reset
    setTimeout(() => {
      captchaRef.current?.resetCaptcha();
      setCaptchaResetting(false);
    }, 500);
  };

  // Check if enough time has passed since last submission to prevent rapid fire
  const canSubmit = () => {
    const timeSinceLastSubmission = Date.now() - lastSubmissionTime;
    return timeSinceLastSubmission > 2000; // 2 second minimum between submissions
  };

  // Enhanced error handling function
  const handleAuthError = (error: any, isSignUp = false) => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('already-seen-response') || 
        errorMessage.includes('captcha protection')) {
      toast({
        title: "Captcha Already Used",
        description: "The captcha has already been used. A fresh captcha is being loaded...",
        variant: "destructive",
      });
      resetCaptcha();
    } else if (errorMessage.includes('captcha')) {
      toast({
        title: "Captcha Failed",
        description: "Captcha verification failed. Please complete the captcha again.",
        variant: "destructive",
      });
      resetCaptcha();
    } else if (errorMessage.includes('504') || 
               errorMessage.includes('timeout') || 
               errorMessage.includes('processing this request timed out')) {
      if (isSignUp) {
        toast({
          title: "Request Timeout",
          description: "Your signup request timed out, but your account may have been created. Please check your email for a verification link, or try signing in if the account was created.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request Timeout",
          description: "The request timed out. Please try again with a fresh captcha.",
          variant: "destructive",
        });
      }
      resetCaptcha();
    } else if (errorMessage.includes('context deadline exceeded')) {
      toast({
        title: "Server Timeout",
        description: "The server is taking too long to respond. Please try again in a moment.",
        variant: "destructive",
      });
      resetCaptcha();
    } else {
      const enhancedError = rateLimit.getErrorMessage(error.message);
      toast({
        title: isLogin ? "Sign in failed" : "Sign up failed",
        description: enhancedError,
        variant: "destructive",
      });
    }
  };

  // Helper function to check user roles and redirect appropriately
  const checkUserRoleAndRedirect = async (userId: string) => {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const roles = userRoles?.map(r => r.role) || [];
      console.log('User roles after sign in:', roles);
      
      // Always redirect employer users to employer dashboard
      if (roles.includes('employer') || roles.includes('both')) {
        console.log('User has employer role, redirecting to employer dashboard');
        navigate('/employer/dashboard', { replace: true });
      } else {
        console.log('User does not have employer role, redirecting to job seeker dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
      // Default redirect to employer dashboard since they're on employer auth page
      navigate('/employer/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken || captchaResetting) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      });
      return;
    }

    if (!isCaptchaTokenFresh()) {
      toast({
        title: "Captcha Expired",
        description: "Captcha has expired. Please complete a new captcha verification.",
        variant: "destructive",
      });
      resetCaptcha();
      return;
    }

    if (!canSubmit()) {
      toast({
        title: "Please Wait",
        description: "Please wait a moment before trying again.",
        variant: "destructive",
      });
      return;
    }

    if (!rateLimit.canAttempt) {
      toast({
        title: "Rate Limited",
        description: rateLimit.getCooldownMessage(),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setLastSubmissionTime(Date.now());

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, captchaToken);
        if (error) {
          handleAuthError(error, false);
          rateLimit.recordAttempt(false, error.message);
        } else {
          rateLimit.recordAttempt(true);
          toast({
            title: "Welcome back!",
            description: "Successfully signed in to your employer account.",
          });
          
          // Get current user and check their roles
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await checkUserRoleAndRedirect(user.id);
          } else {
            navigate('/employer/dashboard', { replace: true });
          }
        }
      } else {
        // Use the employer dashboard as redirect URL for sign up
        const redirectUrl = `${window.location.origin}/employer/dashboard`;
        const { error } = await signUp(email, password, fullName, redirectUrl, captchaToken);
        
        if (error) {
          handleAuthError(error, true);
          rateLimit.recordAttempt(false, error.message);
        } else {
          rateLimit.recordAttempt(true);
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account. Once verified, you'll be redirected to your employer dashboard.",
          });
          
          // Navigate to verification page with employer context
          navigate(`/verify-email?email=${encodeURIComponent(email)}&type=employer`);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center">
                <Building className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {isLogin ? 'Employer Sign In' : 'Join as an Employer'}
              </CardTitle>
              <CardDescription className="text-lg">
                {isLogin 
                  ? 'Access your employer dashboard and manage job postings' 
                  : 'Start posting jobs and finding the perfect candidates'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!rateLimit.canAttempt && (
                <Alert className="mb-6 border-orange-200 bg-orange-50">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="flex items-center gap-2">
                      <span>Rate limited:</span>
                      <span className="font-medium">{rateLimit.getCooldownMessage()}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Company Name
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company name"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    minLength={6}
                  />
                </div>
                
                <div className="flex justify-center">
                <HCaptcha
                  ref={captchaRef}
                  sitekey="77fabb62-1a5e-4e3c-bf9e-1cda92a08514"
                  onVerify={(token) => {
                    setCaptchaToken(token);
                    setCaptchaTokenTimestamp(Date.now());
                  }}
                  onExpire={() => {
                    setCaptchaToken(null);
                  }}
                  onError={() => {
                    setCaptchaToken(null);
                  }}
                />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3"
                  disabled={loading || !captchaToken || !rateLimit.canAttempt}
                  size="lg"
                >
                  {loading ? (
                    'Processing...'
                  ) : !rateLimit.canAttempt ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Wait {rateLimit.remainingCooldown}s
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Employer Account'
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an employer account?" : "Already have an account?"}
                </p>
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {isLogin ? 'Sign up as an employer' : 'Sign in instead'}
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Looking to find a job instead?{' '}
                  <Link to="/auth" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Job seeker sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployerAuth;
