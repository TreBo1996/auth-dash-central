
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CoverLetterCreator } from '@/components/cover-letter/CoverLetterCreator';
import { CoverLetterManager } from '@/components/cover-letter/CoverLetterManager';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';

export const CoverLetters: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSave = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('manage');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cover Letters</h1>
          <p className="text-muted-foreground">
            Create AI-powered cover letters tailored to your resumes and job descriptions
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'manage' ? 'default' : 'outline'}
            onClick={() => setActiveTab('manage')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            My Cover Letters
          </Button>
          <Button
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'manage' ? (
          <CoverLetterManager refreshTrigger={refreshTrigger} />
        ) : (
          <CoverLetterCreator onSave={handleSave} />
        )}
      </div>
    </DashboardLayout>
  );
};
