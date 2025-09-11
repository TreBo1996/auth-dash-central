import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { WalletSignIn } from '@/components/auth/WalletSignIn';

const SimpleAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email.');
    }
    
    setLoading(false);
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-purple-300/10 rounded-full blur-2xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6 hover:scale-105 transition-transform">
            <img 
              src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
              alt="RezLit Logo" 
              className="h-16 mx-auto drop-shadow-lg"
            />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-sm">
            Welcome to RezLit
          </h1>
          <p className="text-blue-100 text-lg drop-shadow-sm">
            AI-Powered Job Search Tool - Land Your Dream Job 3x Faster
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 mb-6 border-0 shadow-lg">
            <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium">Sign Up</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="backdrop-blur-md bg-white/95 border-0 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-900 text-2xl">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600">Sign in to access your AI-powered job search tools</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div>
                    <Label htmlFor="signin-email" className="text-gray-700 font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="text-gray-700 font-medium">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mt-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 shadow-lg hover:shadow-xl transition-all" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="backdrop-blur-md bg-white/95 border-0 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-900 text-2xl">Join RezLit</CardTitle>
                <CardDescription className="text-gray-600">Create your account and start landing more interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div>
                    <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-gray-700 font-medium">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mt-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-confirm-password" className="text-gray-700 font-medium flex items-center gap-2">
                      Confirm Password
                      {passwordsMatch && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {passwordsMismatch && <XCircle className="h-4 w-4 text-red-500" />}
                    </Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`mt-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 ${
                        passwordsMismatch ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : passwordsMatch ? 'border-green-400 focus:border-green-500 focus:ring-green-500' : ''
                      }`}
                      placeholder="Confirm your password"
                    />
                    {passwordsMismatch && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Passwords do not match
                      </p>
                    )}
                    {passwordsMatch && (
                      <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 shadow-lg hover:shadow-xl transition-all" disabled={loading || passwordsMismatch}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <div className="backdrop-blur-md bg-white/95 border-0 shadow-2xl rounded-lg p-6">
              <WalletSignIn onSuccess={() => {}} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimpleAuth;