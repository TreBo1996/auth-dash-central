
import React from 'react';
import { Loader2, Sparkles, FileText, Briefcase } from 'lucide-react';

interface AppLoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  message = 'Loading your dashboard...',
  showProgress = true
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Best Hire
          </h1>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700">{message}</p>
          <p className="text-sm text-gray-500">Please wait while we prepare your experience</p>
        </div>

        {/* Progress Indicators */}
        {showProgress && (
          <div className="flex justify-center space-x-8 mt-8">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Loading profile</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-100"></div>
              <span>Preparing dashboard</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-200"></div>
              <span>Loading data</span>
            </div>
          </div>
        )}

        {/* Feature Icons */}
        <div className="flex justify-center space-x-6 mt-8 opacity-60">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Briefcase className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
