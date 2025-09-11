import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Star, Clock, Shield } from 'lucide-react';
import { WalletSignIn } from '@/components/auth/WalletSignIn';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const [formStartTime] = useState<number>(Date.now());
  const [honeypot, setHoneypot] = useState(''); // Bot trap field
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { signIn, signUp, user, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const rateLimit = useAuthRateLimit();

  // Get redirect and from parameters from URL
  const redirectParam = searchParams.get('redirect');
  const fromParam = searchParams.get('from');

  // Check for success message from password reset
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'password-updated') {
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated. You can now sign in with your new password.',
      });
    }
  }, [searchParams, toast]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (redirectParam === 'upload-resume') {
        navigate('/upload-resume');
      } else if (fromParam) {
        // If there's a from parameter, redirect back with autoApply
        const redirectUrl = fromParam.includes('?') 
          ? `${fromParam}&autoApply=true`
          : `${fromParam}?autoApply=true`;
        navigate(redirectUrl);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, redirectParam]);

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (password.length < 6) return 'Too short';
    if (password.length < 8) return 'Weak';
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) return 'Medium';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'Good';
    return 'Strong';
  };

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      setEmailValid(validateEmail(value));
    } else {
      setEmailValid(null);
    }
  };

  // Handle password change with strength check
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  // Bot protection checks
  const isValidSubmission = () => {
    // Check honeypot (should be empty)
    if (honeypot !== '') {
      console.log('Bot detected: honeypot filled');
      return false;
    }

    // Check timing (should take at least 3 seconds)
    const timeSinceStart = Date.now() - formStartTime;
    if (timeSinceStart < 3000) {
      console.log('Bot detected: too fast submission');
      return false;
    }

    // Check submission frequency
    const timeSinceLastSubmission = Date.now() - lastSubmissionTime;
    if (timeSinceLastSubmission < 2000) {
      console.log('Rate limited: too frequent submissions');
      return false;
    }

    return true;
  };

  // Enhanced error handling for signup issues
  const handleAuthError = (error: any) => {
    console.log('Full error object:', error);
    
    if (!error || !error.message) {
      setError('Signup request timed out. Supabase may be experiencing temporary issues. Please try again in a few minutes.');
      return;
    }
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('timeout') || errorMessage.includes('504') || errorMessage.includes('upstream')) {
      setError('Server timeout - Supabase is experiencing temporary issues. Your account might still be created. Please check your email or try signing in after a few minutes.');
    } else if (errorMessage.includes('invalid credentials') || errorMessage.includes('invalid login')) {
      setError('Invalid email or password. Please try again.');
    } else if (errorMessage.includes('user already registered')) {
      setError('An account with this email already exists. Try signing in instead.');  
    } else if (errorMessage.includes('email rate limit')) {
      setError('Too many emails sent. Please wait a few minutes before trying again.');
    } else {
      setError(`Signup failed: ${error.message}. Please try again or contact support if this persists.`);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Bot protection
    if (!isValidSubmission()) {
      setError('Please wait a moment before submitting.');
      return;
    }

    if (!rateLimit.canAttempt) {
      setError(rateLimit.getCooldownMessage());
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setLastSubmissionTime(Date.now());

    // No captcha needed - completely frictionless
    const { error } = await signIn(email, password);
    
    if (error) {
      handleAuthError(error);
      rateLimit.recordAttempt(false, error.message);
    } else {
      rateLimit.recordAttempt(true);
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      
      if (redirectParam === 'upload-resume') {
        navigate('/upload-resume');
      } else if (fromParam) {
        // If there's a from parameter, redirect back with autoApply
        const redirectUrl = fromParam.includes('?') 
          ? `${fromParam}&autoApply=true`
          : `${fromParam}?autoApply=true`;
        navigate(redirectUrl);
      } else {
        navigate('/job-hub');
      }
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!termsAccepted) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    // Bot protection
    if (!isValidSubmission()) {
      setError('Please wait a moment before submitting.');
      return;
    }

    if (!rateLimit.canAttempt) {
      setError(rateLimit.getCooldownMessage());
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setLastSubmissionTime(Date.now());

    // Simplified signup - no redirect complexity, roles handled after auth
    const { error } = await signUp(email, password);
    
    if (error) {
      handleAuthError(error);
      rateLimit.recordAttempt(false, error.message);
    } else {
      rateLimit.recordAttempt(true);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
      // Preserve the from parameter through the verification flow
      const verifyUrl = new URLSearchParams();
      verifyUrl.set('email', email);
      if (fromParam) {
        verifyUrl.set('from', fromParam);
      }
      navigate(`/verify-email?${verifyUrl.toString()}`);
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !validateEmail(resetEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    setError(null);

    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      setError(`Failed to send reset email: ${error.message}`);
    } else {
      toast({
        title: "Password reset email sent!",
        description: "Check your email for instructions to reset your password.",
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
    
    setResetLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('New password is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        handleAuthError(error);
      } else {
        toast({
          title: "Password updated!",
          description: "Your password has been successfully updated.",
        });
        navigate('/job-hub');
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // If this is a password reset flow, show the reset form
  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
                alt="RezLit Logo" 
                className="h-12 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-blue-100">Enter your new password below</p>
          </div>

          <Card className="backdrop-blur-md bg-white/95 border-0 shadow-xl">
            <CardContent className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
              alt="RezLit Logo" 
              className="h-12 w-auto"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
            <Star className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">Trusted by 50,000+ job seekers</span>
          </div>
          <p className="text-blue-100 text-lg">
            {redirectParam === 'upload-resume' 
              ? 'Sign in to upload and optimize your resume with AI'
              : 'Transform your career with AI-powered resume optimization'
            }
          </p>
        </div>

        <Card className="backdrop-blur-md bg-white/95 border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome
            </CardTitle>
            <CardDescription className="text-gray-600">
              {fromParam 
                ? 'Sign in to continue where you left off'
                : 'Sign in to your account or create a new one'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                   </div>
                   
                   <div className="flex items-center justify-between">
                     <button
                       type="button"
                       onClick={() => setShowForgotPassword(true)}
                       className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                     >
                       Forgot Password?
                     </button>
                   </div>
                   
                   {/* No captcha - completely frictionless signin */}
                   <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                     <Shield className="h-4 w-4 text-blue-600" />
                     <span>Secure and instant sign in</span>
                   </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg" 
                    disabled={isLoading || !rateLimit.canAttempt}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : !rateLimit.canAttempt ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Wait {rateLimit.remainingCooldown}s
                      </>
                    ) : (
                      'Sign In - Instant Access'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Honeypot field - hidden from users, visible to bots */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className={`border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 ${
                          emailValid === false ? 'border-red-300 focus:border-red-500' : 
                          emailValid === true ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                        required
                      />
                      {emailValid === false && (
                        <div className="text-red-500 text-sm mt-1">Please enter a valid email address</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className={`border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 ${
                          password && passwordStrength === 'Too short' ? 'border-red-300' : 
                          password && passwordStrength !== 'Too short' ? 'border-green-300' : ''
                        }`}
                        required
                        minLength={6}
                      />
                      {password && (
                        <div className={`text-sm mt-1 ${
                          passwordStrength === 'Too short' || passwordStrength === 'Weak' ? 'text-red-500' :
                          passwordStrength === 'Medium' ? 'text-yellow-500' :
                          passwordStrength === 'Good' || passwordStrength === 'Strong' ? 'text-green-500' : ''
                        }`}>
                          Password strength: {passwordStrength}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms of Service and Privacy Policy Agreement */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Checkbox
                        id="terms-agreement"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor="terms-agreement" 
                          className="text-sm text-gray-700 cursor-pointer leading-relaxed"
                        >
                          I agree to the{' '}
                          <Link 
                            to="/terms-of-service" 
                            target="_blank"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                          >
                            Terms of Service
                          </Link>
                          {' '}and{' '}
                          <Link 
                            to="/privacy-policy" 
                            target="_blank"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                          >
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>
                    </div>

                    {/* No captcha for frictionless signup */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Protected by smart bot detection</span>
                    </div>
                  </div>
                  
                   <Button 
                     type="submit" 
                     className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 shadow-lg" 
                     disabled={isLoading || !rateLimit.canAttempt || emailValid === false || passwordStrength === 'Too short' || !termsAccepted}
                   >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : !rateLimit.canAttempt ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Wait {rateLimit.remainingCooldown}s
                      </>
                    ) : (
                      'Create Account - Free & Instant'
                    )}
                   </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                   <Button 
                     type="submit" 
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                     disabled={resetLoading}
                   >
                     {resetLoading ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Sending...
                       </>
                     ) : (
                       'Send Reset Email'
                     )}
                   </Button>
                 </form>
                 
                 <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                   <h4 className="text-sm font-medium text-blue-900 mb-2">Email Delivery Tips:</h4>
                   <ul className="text-xs text-blue-700 space-y-1">
                     <li>• Check your spam/junk folder</li>
                     <li>• Check promotions tab (Gmail)</li>
                     <li>• Wait up to 5 minutes for delivery</li>
                     <li>• Add no-reply@yourdomain.com to contacts</li>
                   </ul>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;