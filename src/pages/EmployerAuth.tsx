
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Mail, Lock, User, ArrowLeft, Briefcase, Clock, AlertTriangle, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { supabase } from '@/integrations/supabase/client';

const EmployerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const [formStartTime] = useState<number>(Date.now());
  const [honeypot, setHoneypot] = useState(''); // Bot trap field
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const rateLimit = useAuthRateLimit();

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

  // Simplified error handling
  const handleAuthError = (error: any) => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('invalid credentials') || errorMessage.includes('invalid login')) {
      toast({
        title: "Sign in failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } else if (errorMessage.includes('user already registered')) {
      toast({
        title: "Account exists",
        description: "An account with this email already exists. Try signing in instead.",
        variant: "destructive",
      });
    } else if (errorMessage.includes('email rate limit')) {
      toast({
        title: "Rate limited",
        description: "Too many emails sent. Please wait a few minutes before trying again.",
        variant: "destructive",
      });
    } else if (errorMessage.includes('timeout')) {
      toast({
        title: "Request timeout",
        description: "Request timed out. Your account may have been created - check your email or try signing in.",
        variant: "destructive",
      });
    } else {
      toast({
        title: isLogin ? "Sign in failed" : "Sign up failed",
        description: "Something went wrong. Please try again.",
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Bot protection
    if (!isValidSubmission()) {
      toast({
        title: "Please wait",
        description: "Please wait a moment before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!rateLimit.canAttempt) {
      toast({
        title: "Rate limited",
        description: rateLimit.getCooldownMessage(),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setLastSubmissionTime(Date.now());

    try {
      // No captcha needed - completely frictionless
      const { error } = await signIn(email, password);
      if (error) {
        handleAuthError(error);
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
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password || !fullName.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Bot protection
    if (!isValidSubmission()) {
      toast({
        title: "Please wait",
        description: "Please wait a moment before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!rateLimit.canAttempt) {
      toast({
        title: "Rate limited",
        description: rateLimit.getCooldownMessage(),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setLastSubmissionTime(Date.now());

    try {
      // Simplified signup - no complex redirect logic
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        handleAuthError(error);
        rateLimit.recordAttempt(false, error.message);
      } else {
        rateLimit.recordAttempt(true);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account. You'll be able to choose your role after verification.",
        });
        
        // Navigate to verification page
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
              <div className="mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
                  alt="RezLit Logo" 
                  className="h-12 w-auto"
                />
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
              
              <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-6">
                {!isLogin && (
                  <>
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
                      <Label htmlFor="fullName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <div className="relative">
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          placeholder="Your full name"
                          className={`border-gray-200 focus:border-indigo-500 focus:ring-indigo-500`}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Company Name (Optional)
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company name"
                        className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                      placeholder="your@company.com"
                      className={`border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 ${
                        emailValid === false ? 'border-red-300 focus:border-red-500' : 
                        emailValid === true ? 'border-green-300 focus:border-green-500' : ''
                      }`}
                    />
                    {emailValid === false && (
                      <div className="text-red-500 text-sm mt-1">Please enter a valid email address</div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      placeholder="Enter your password"
                      minLength={6}
                      className={`border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 ${
                        password && passwordStrength === 'Too short' ? 'border-red-300' : 
                        password && passwordStrength !== 'Too short' ? 'border-green-300' : ''
                      }`}
                    />
                    {password && !isLogin && (
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
                
                {/* No captcha - completely frictionless for both signin and signup */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>{isLogin ? 'Secure and instant sign in' : 'Protected by smart bot detection - No captcha required!'}</span>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3"
                  disabled={loading || !rateLimit.canAttempt || (!isLogin && (emailValid === false || passwordStrength === 'Too short' || !fullName.trim()))}
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
                    isLogin ? 'Sign In - Instant Access' : 'Create Employer Account - Free & Instant'
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
