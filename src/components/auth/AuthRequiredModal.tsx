import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Star, TrendingUp, Target, Briefcase, FileText, MessageSquare, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
  companyName?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  companyName
}) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    const currentUrl = window.location.pathname + window.location.search;
    navigate(`/auth?from=${encodeURIComponent(currentUrl)}`);
  };

  const handleSignIn = () => {
    const currentUrl = window.location.pathname + window.location.search;
    navigate(`/auth?from=${encodeURIComponent(currentUrl)}`);
  };

  const benefits = [
    {
      icon: Zap,
      title: "AI-Optimized Applications",
      description: "Tailor your resume for maximum ATS compatibility"
    },
    {
      icon: FileText,
      title: "Professional Templates",
      description: "Access industry-specific resume templates"
    },
    {
      icon: MessageSquare,
      title: "Cover Letter Generator",
      description: "Create compelling cover letters instantly"
    },
    {
      icon: Target,
      title: "Application Tracking",
      description: "Keep track of all your job applications"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-blue-50 border-indigo-200">
        <DialogHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-2">
            <User className="h-8 w-8 text-indigo-600" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {jobTitle ? `Apply for ${jobTitle}` : 'Apply for This Position'}
          </DialogTitle>
          {companyName && (
            <p className="text-lg text-gray-600 font-medium">
              at {companyName}
            </p>
          )}
          <p className="text-gray-600">
            Create your free account to apply and unlock powerful job search tools
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Free forever
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              3x more interviews
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              95% ATS pass rate
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-white/60 border border-indigo-100">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <benefit.icon className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{benefit.title}</h3>
                <p className="text-xs text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-center text-blue-800 text-sm">
            <strong>Ready to apply?</strong> Join thousands of job seekers who've landed their dream jobs with RezLit's AI tools
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={handleSignUp}
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Sign Up to Apply
          </Button>
          <Button 
            onClick={handleSignIn}
            variant="outline" 
            className="flex-1 h-11 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            Already have an account? Sign In
          </Button>
        </div>

        <div className="flex justify-center pt-3">
          <Button 
            onClick={onClose}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-2">
          No credit card required • Join in 30 seconds • Start applying immediately
        </p>
      </DialogContent>
    </Dialog>
  );
};