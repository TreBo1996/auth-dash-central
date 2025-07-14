import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar,
  ChevronDown,
  FileText,
  Mail,
  Eye,
  Plus,
  ExternalLink,
  Award,
  CheckCircle,
  Clock
} from 'lucide-react';
import { ApplicationStackModal } from './ApplicationStackModal';
import { CreateApplicationStackModal } from './CreateApplicationStackModal';
import { ResumeTemplateModal } from './ResumeTemplateModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface JobHubCardProps {
  job: {
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    salary_range: string | null;
    parsed_text: string;
    source: string | null;
    job_url: string | null;
    created_at: string;
    is_applied?: boolean;
    is_saved?: boolean;
    optimized_resumes?: any[];
    cover_letters?: any[];
  };
  onStatusUpdate: (jobId: string, field: string, value: boolean) => void;
}

export const JobHubCard: React.FC<JobHubCardProps> = ({ job, onStatusUpdate }) => {
  const [showStackModal, setShowStackModal] = useState(false);
  const [showCreateStackModal, setShowCreateStackModal] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);

  const hasOptimizedResume = job.optimized_resumes && job.optimized_resumes.length > 0;
  const hasCoverLetter = job.cover_letters && job.cover_letters.length > 0;
  const hasCompleteStack = hasOptimizedResume && hasCoverLetter;
  
  const latestResume = hasOptimizedResume ? job.optimized_resumes[0] : null;
  const latestCoverLetter = hasCoverLetter ? job.cover_letters[0] : null;

  const getStackStatus = () => {
    if (hasCompleteStack) return { text: 'Complete', color: 'bg-green-500', icon: CheckCircle };
    if (hasOptimizedResume || hasCoverLetter) return { text: 'Partial', color: 'bg-yellow-500', icon: Clock };
    return { text: 'Missing', color: 'bg-gray-400', icon: Plus };
  };

  const stackStatus = getStackStatus();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2 text-gray-900">
                {job.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                {job.company && (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {job.company}
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                )}
                {job.salary_range && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {job.salary_range}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={job.source === 'upload' ? 'default' : 'secondary'}>
                {job.source === 'upload' ? 'Uploaded' : 'External'}
              </Badge>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(job.created_at)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Job Description Preview */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {truncateText(job.parsed_text)}
            </p>
            {job.job_url && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto mt-1 text-blue-600"
                onClick={() => window.open(job.job_url!, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Original Job Posting
              </Button>
            )}
          </div>

          {/* Application Status Controls */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={job.is_saved || false}
                  onCheckedChange={(checked) => onStatusUpdate(job.id, 'is_saved', checked)}
                />
                <span className="text-sm font-medium">Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={job.is_applied || false}
                  onCheckedChange={(checked) => onStatusUpdate(job.id, 'is_applied', checked)}
                />
                <span className="text-sm font-medium">Applied</span>
              </div>
            </div>
          </div>

          {/* Application Stack Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Application Stack</h4>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stackStatus.color}`} />
                <span className="text-sm text-gray-600">{stackStatus.text}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Resume Status */}
              <div 
                className={`p-3 bg-white border rounded-lg transition-colors ${
                  hasOptimizedResume 
                    ? 'cursor-pointer hover:bg-gray-50 hover:border-blue-300' 
                    : ''
                }`}
                onClick={hasOptimizedResume ? () => setShowResumePreview(true) : undefined}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Resume</span>
                  {hasOptimizedResume && latestResume?.ats_score && (
                    <Badge variant="secondary" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      {latestResume.ats_score}% ATS
                    </Badge>
                  )}
                </div>
                {hasOptimizedResume ? (
                  <p className="text-xs text-green-600">✓ Optimized Resume Ready</p>
                ) : (
                  <p className="text-xs text-gray-500">Not created</p>
                )}
              </div>

              {/* Cover Letter Status */}
              <div className="p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Cover Letter</span>
                </div>
                {hasCoverLetter ? (
                  <p className="text-xs text-green-600">✓ Cover Letter Ready</p>
                ) : (
                  <p className="text-xs text-gray-500">Not created</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {hasCompleteStack ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowStackModal(true)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Stack
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateStackModal(true)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Stack
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {latestResume && (
                    <DropdownMenuItem onClick={() => setShowResumePreview(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Preview Resume
                    </DropdownMenuItem>
                  )}
                  {latestCoverLetter && (
                    <DropdownMenuItem onClick={() => setShowCoverLetterPreview(true)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Preview Cover Letter
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = `/upload-resume?jobId=${job.id}`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Optimize Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => window.location.href = `/cover-letters?jobId=${job.id}`}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Generate Cover Letter
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = `/upload-job?edit=${job.id}`}
                  >
                    Edit Job Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Stack Preview Modal */}
      <ApplicationStackModal 
        isOpen={showStackModal}
        onClose={() => setShowStackModal(false)}
        job={job}
        resume={latestResume}
        coverLetter={latestCoverLetter}
      />

      {/* Create Application Stack Modal */}
      <CreateApplicationStackModal 
        isOpen={showCreateStackModal}
        onClose={() => setShowCreateStackModal(false)}
        job={job}
        onComplete={() => {
          setShowCreateStackModal(false);
          // Trigger a refresh of the job data in the parent component
          // The parent should re-fetch the job data to show updated stack status
        }}
      />

      {/* Resume Template Preview Modal */}
      {latestResume && (
        <ResumeTemplateModal
          isOpen={showResumePreview}
          onClose={() => setShowResumePreview(false)}
          optimizedResumeId={latestResume.id}
          onEdit={() => {
            setShowResumePreview(false);
            window.location.href = `/resume-editor/${latestResume.id}`;
          }}
        />
      )}

      {/* Cover Letter Preview Modal */}
      {latestCoverLetter && showCoverLetterPreview && (
        <Dialog open={showCoverLetterPreview} onOpenChange={setShowCoverLetterPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{latestCoverLetter.title}</DialogTitle>
            </DialogHeader>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                {latestCoverLetter.generated_text}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};