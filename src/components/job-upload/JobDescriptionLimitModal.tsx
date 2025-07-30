import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Calendar, Zap, FileText, CheckCircle } from 'lucide-react';

interface JobDescriptionLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUsage: number;
  limit: number;
}

export const JobDescriptionLimitModal: React.FC<JobDescriptionLimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  currentUsage,
  limit
}) => {
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1, 1);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-orange-500" />
            Job Description Limit Reached
          </DialogTitle>
          <DialogDescription className="text-base">
            You've reached your monthly limit for saving job descriptions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Usage Display */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Usage</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {currentUsage} / {limit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Job descriptions saved this month
                  </p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  Free Plan
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reset Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Your limit resets on:</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {nextResetDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Upgrade to Premium</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Unlimited</strong> job description saves</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Unlimited</strong> resume optimizations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Unlimited</strong> cover letter generations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Premium resume templates</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Just <span className="font-semibold text-gray-900">$19.99/month</span> - cancel anytime
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              I'll Wait
            </Button>
            <Button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};