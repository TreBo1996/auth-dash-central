import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleSelectionProps {
  fromParam?: string | null;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ fromParam }) => {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { createRole } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRoleSelection = async () => {
    if (!selectedRole) return;

    setIsCreating(true);
    try {
      const success = await createRole(selectedRole);
      
      if (success) {
        toast({
          title: "Welcome to RezLit!",
          description: `Your ${selectedRole === 'job_seeker' ? 'job seeker' : 'employer'} account is ready.`,
        });
        
        // Navigate to appropriate destination
        if (selectedRole === 'employer') {
          // Employers go to their dashboard (no employment preferences needed)
          navigate(fromParam || '/employer/dashboard');
        } else {
          // Job seekers will be handled by employment preferences modal
          // If no fromParam, let the normal flow continue to dashboard
          if (!fromParam) {
            navigate('/dashboard');
          }
          // If there's a fromParam, the employment preferences modal will handle the redirect
        }
      } else {
        toast({
          title: "Setup failed",
          description: "Could not complete account setup. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to RezLit!</h1>
          <p className="text-blue-100 text-lg">
            {fromParam 
              ? 'Choose your role to continue where you left off'
              : 'Choose how you\'d like to use our platform'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Job Seeker Option */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'job_seeker' 
                ? 'ring-2 ring-white bg-white/95' 
                : 'bg-white/90 hover:bg-white/95'
            }`}
            onClick={() => setSelectedRole('job_seeker')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full w-16 h-16 flex items-center justify-center">
                <Search className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">I'm looking for a job</CardTitle>
              <CardDescription className="text-base">
                Optimize your resume, find job opportunities, and ace interviews with AI-powered tools
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• AI-powered resume optimization</li>
                <li>• ATS score analysis</li>
                <li>• Interview preparation</li>
                <li>• Job search and matching</li>
              </ul>
            </CardContent>
          </Card>

          {/* Employer Option */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'employer' 
                ? 'ring-2 ring-white bg-white/95' 
                : 'bg-white/90 hover:bg-white/95'
            }`}
            onClick={() => setSelectedRole('employer')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">I'm hiring talent</CardTitle>
              <CardDescription className="text-base">
                Post jobs, manage applications, and find the perfect candidates for your team
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Post and manage job listings</li>
                <li>• Review candidate applications</li>
                <li>• AI-powered candidate matching</li>
                <li>• Streamlined hiring workflow</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={handleRoleSelection}
            disabled={!selectedRole || isCreating}
            size="lg"
            className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                Continue as {selectedRole === 'job_seeker' ? 'Job Seeker' : selectedRole === 'employer' ? 'Employer' : '...'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          
          {selectedRole && (
            <p className="text-blue-100 text-sm mt-4">
              Don't worry, you can always change this later in your account settings
            </p>
          )}
        </div>
      </div>
    </div>
  );
};