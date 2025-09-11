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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6 hover:scale-105 transition-transform">
            <img 
              src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
              alt="RezLit Logo" 
              className="h-16 mx-auto"
            />
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to RezLit
          </h1>
          <p className="text-blue-100 text-lg">
            AI-Powered Job Search Tool - Land Your Dream Job 3x Faster
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-sm border-white/30">
            <TabsTrigger value="signin" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-white/80">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-white/80">Sign Up</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-white/80">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl">Welcome Back</CardTitle>
                <CardDescription className="text-blue-100">Sign in to access your AI-powered job search tools</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-white">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="text-white">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-semibold" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl">Join RezLit</CardTitle>
                <CardDescription className="text-blue-100">Create your account and start landing more interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-white">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-confirm-password" className="text-white flex items-center gap-2">
                      Confirm Password
                      {passwordsMatch && <CheckCircle className="h-4 w-4 text-green-400" />}
                      {passwordsMismatch && <XCircle className="h-4 w-4 text-red-400" />}
                    </Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 ${
                        passwordsMismatch ? 'border-red-400' : passwordsMatch ? 'border-green-400' : ''
                      }`}
                      placeholder="Confirm your password"
                    />
                    {passwordsMismatch && (
                      <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                    )}
                    {passwordsMatch && (
                      <p className="text-green-400 text-sm mt-1">Passwords match</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-semibold" disabled={loading || passwordsMismatch}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <div className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl rounded-lg p-6">
              <WalletSignIn onSuccess={() => {}} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimpleAuth;