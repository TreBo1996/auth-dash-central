import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Star, TrendingUp, Target, Briefcase, FileText, MessageSquare } from 'lucide-react';

interface SignupBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export const SignupBenefitsModal: React.FC<SignupBenefitsModalProps> = ({
  isOpen,
  onClose,
  featureName
}) => {
  const handleSignUp = () => {
    window.location.href = '/auth';
  };

  const benefits = [
    {
      icon: Zap,
      title: "AI-Powered Resume Optimization",
      description: "Beat 95% of ATS systems with intelligent optimization"
    },
    {
      icon: FileText,
      title: "Professional Resume Templates",
      description: "Access beautifully designed, ATS-compliant templates"
    },
    {
      icon: MessageSquare,
      title: "AI-Generated Cover Letters",
      description: "Create compelling, tailored cover letters in minutes"
    },
    {
      icon: Target,
      title: "Mock Interview Practice",
      description: "Practice with personalized AI interview coaching"
    },
    {
      icon: TrendingUp,
      title: "Advanced ATS Scoring",
      description: "Get detailed insights and improvement suggestions"
    },
    {
      icon: Briefcase,
      title: "Smart Job Search Tools",
      description: "Save jobs and get AI-powered application insights"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-blue-50 border-indigo-200">
        <DialogHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto w-28 h-28 mb-2 flex items-center justify-center">
            <img 
              src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
              alt="RezLit Logo" 
              className="h-24 w-auto object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Transform Your Career with AI
          </DialogTitle>
          <p className="text-lg text-gray-600">
            Join thousands of professionals who've accelerated their job search with AI-powered tools
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Trusted by 50,000+ job seekers
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              3x more interviews
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-white/50 border border-indigo-100">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <benefit.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {featureName && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-center text-orange-800">
              <strong>Ready to access {featureName}?</strong> Create your free account to get started!
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-indigo-100">
          <Button 
            onClick={handleSignUp}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Start Free Today
          </Button>
          <Button 
            onClick={onClose}
            variant="outline" 
            className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          No credit card required • Free forever plan available • Join in 30 seconds
        </p>
      </DialogContent>
    </Dialog>
  );
};