
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CoverLetterGenerator } from '@/components/CoverLetterGenerator';
import { ContentPreview } from '@/components/ContentPreview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Plus, Building, Calendar, Target, Zap, FileText, Clock, Award, Users, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Rocket, Star, CheckCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContextualUsageCounter } from '@/components/common/ContextualUsageCounter';

interface CoverLetterWithJob {
  id: string;
  title: string;
  created_at: string;
  job_title: string;
  company: string;
  generated_text: string;
}

export const CoverLetters: React.FC = () => {
  const { user } = useAuth();
  const [coverLetters, setCoverLetters] = useState<CoverLetterWithJob[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<CoverLetterWithJob | null>(null);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showSuccessMetrics, setShowSuccessMetrics] = useState(false);

  useEffect(() => {
    loadCoverLetters();
  }, [user]);

  const loadCoverLetters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cover_letters')
        .select(`
          id, 
          title, 
          created_at,
          generated_text,
          job_descriptions!inner(
            title,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        created_at: item.created_at,
        generated_text: item.generated_text,
        job_title: item.job_descriptions.title,
        company: item.job_descriptions.company
      }));
      
      setCoverLetters(formattedData);
    } catch (error) {
      console.error('Error loading cover letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverLetterCreated = () => {
    loadCoverLetters();
    setShowGenerator(false);
  };

  const handleViewCoverLetter = (coverLetter: CoverLetterWithJob) => {
    setSelectedCoverLetter(coverLetter);
  };

  const handleClosePreview = () => {
    setSelectedCoverLetter(null);
  };

  if (showGenerator) {
    return (
      <DashboardLayout>
        <CoverLetterGenerator
          onComplete={handleCoverLetterCreated}
          onCancel={() => setShowGenerator(false)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cover Letters</h1>
            <p className="text-muted-foreground">
              Create personalized cover letters tailored to specific job opportunities
            </p>
          </div>
          <Button onClick={() => setShowGenerator(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cover Letter
          </Button>
        </div>

        {/* Benefits Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Rocket className="h-5 w-5" />
              Why Use AI Cover Letters?
            </CardTitle>
            <CardDescription className="text-blue-700">
              Create personalized, professional cover letters that get you noticed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Job-Specific Personalization</h4>
                  <p className="text-sm text-gray-600">Tailored content that matches job requirements and company culture</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Save Time & Effort</h4>
                  <p className="text-sm text-gray-600">Generate professional letters in minutes instead of hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">AI-Powered Content</h4>
                  <p className="text-sm text-gray-600">Intelligent matching of your skills to job requirements</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Professional Formatting</h4>
                  <p className="text-sm text-gray-600">Perfect structure and tone for any industry</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Higher Response Rates</h4>
                  <p className="text-sm text-gray-600">Stand out from generic applications with personalized content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Easy Management</h4>
                  <p className="text-sm text-gray-600">Store, edit, and reuse cover letters for future applications</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works & Tips */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Collapsible open={showUsageGuide} onOpenChange={setShowUsageGuide}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      How to Create Perfect Cover Letters
                    </div>
                    {showUsageGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <h4 className="font-medium mb-1">Upload Your Resume</h4>
                        <p className="text-sm text-muted-foreground">Start with an up-to-date resume that reflects your current skills and experience.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <h4 className="font-medium mb-1">Add Job Description</h4>
                        <p className="text-sm text-muted-foreground">Paste or upload the complete job posting for accurate matching.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <h4 className="font-medium mb-1">Generate & Customize</h4>
                        <p className="text-sm text-muted-foreground">Our AI creates a personalized letter that you can further edit and refine.</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Pro Tip:</strong> Use optimized resumes for even better results. The AI will leverage improved keywords and formatting.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={showSuccessMetrics} onOpenChange={setShowSuccessMetrics}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      Success Metrics & Best Practices
                    </div>
                    {showSuccessMetrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">65%</div>
                        <div className="text-sm text-green-700">Higher Response Rate</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">15min</div>
                        <div className="text-sm text-blue-700">Average Time Saved</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Always customize the greeting with hiring manager's name when available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Include specific achievements and metrics from your experience</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Research the company culture and incorporate relevant values</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Keep letters concise - aim for 3-4 paragraphs maximum</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Usage Counter */}
        <ContextualUsageCounter features={['cover_letters']} />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : coverLetters.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cover letters yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first personalized cover letter using your resume and job descriptions.
              </p>
              <Button onClick={() => setShowGenerator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Cover Letter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetters.map((coverLetter) => (
              <Card key={coverLetter.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold line-clamp-2">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    {coverLetter.job_title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {coverLetter.company}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3" />
                    Created {new Date(coverLetter.created_at).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {coverLetter.generated_text.substring(0, 150)}...
                  </p>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewCoverLetter(coverLetter)}
                    >
                      View Cover Letter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedCoverLetter && (
          <ContentPreview
            content={selectedCoverLetter.generated_text}
            title={`${selectedCoverLetter.job_title} at ${selectedCoverLetter.company}`}
            type="cover-letter"
            onClose={handleClosePreview}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoverLetters;
