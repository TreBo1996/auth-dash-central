import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { ApplicationStackModal } from './ApplicationStackModal';
import { CreateApplicationStackModal } from './CreateApplicationStackModal';
import { CoverLetterGenerationModal } from './CoverLetterGenerationModal';
import { ResumeTemplateModal } from './ResumeTemplateModal';
import { ContentPreview } from '@/components/ContentPreview';

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
  onRefresh: () => void;
}

export const JobHubCard: React.FC<JobHubCardProps> = ({ job, onStatusUpdate, onRefresh }) => {
  const navigate = useNavigate();
  const [showStackModal, setShowStackModal] = useState(false);
  const [showCreateStackModal, setShowCreateStackModal] = useState(false);
  const [showCoverLetterGenerationModal, setShowCoverLetterGenerationModal] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);

  const hasOptimizedResume = job.optimized_resumes && job.optimized_resumes.length > 0;
  const hasCoverLetter = job.cover_letters && job.cover_letters.length > 0;
  const hasCompleteStack = hasOptimizedResume && hasCoverLetter;
  
  const latestResume = hasOptimizedResume ? job.optimized_resumes[0] : null;
  const latestCoverLetter = hasCoverLetter ? job.cover_letters[0] : null;

  const getStackStatus = () => {
    if (hasCompleteStack) return { text: 'Complete', color: 'bg-green-500', textColor: 'text-green-700', icon: CheckCircle };
    if (hasOptimizedResume || hasCoverLetter) return { text: 'Partial', color: 'bg-yellow-500', textColor: 'text-yellow-700', icon: Clock };
    return { text: 'Missing', color: 'bg-gray-400', textColor: 'text-gray-700', icon: Plus };
  };

  const stackStatus = getStackStatus();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate pr-2">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    {job.company && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{job.company}</span>
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{job.location}</span>
                      </div>
                    )}
                    {job.salary_range && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{job.salary_range}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={job.source === 'upload' ? 'default' : 'secondary'} className="text-xs">
                    {job.source === 'upload' ? 'Uploaded' : 'External'}
                  </Badge>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(job.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Section: Status Controls */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={job.is_applied || false}
                    onCheckedChange={(checked) => onStatusUpdate(job.id, 'is_applied', checked)}
                    className="scale-75"
                  />
                  <span className="text-xs font-medium text-gray-600">Applied</span>
                </div>
              </div>

              {/* Stack Status */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                <div className={`w-2 h-2 rounded-full ${stackStatus.color}`} />
                <span className={`text-xs font-medium ${stackStatus.textColor}`}>
                  {stackStatus.text}
                </span>
                {hasOptimizedResume && latestResume?.ats_score && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                    {latestResume.ats_score}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {(hasOptimizedResume || hasCoverLetter) ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      className="h-8 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview Stack
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-white border shadow-lg z-50">
                    <DropdownMenuLabel className="font-medium text-gray-900">
                      Application Stack
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Resume Section */}
                    {latestResume && (
                      <div className="px-3 py-2 border-b">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Resume</span>
                          {latestResume.ats_score && (
                            <Badge variant="secondary" className="text-xs">
                              {latestResume.ats_score}% ATS
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Created {formatDate(latestResume.created_at)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowResumePreview(true)}
                          className="h-7 text-xs w-full justify-start"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Preview Resume
                        </Button>
                      </div>
                    )}
                    
                    {/* Cover Letter Section */}
                    {latestCoverLetter && (
                      <div className="px-3 py-2 border-b">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Cover Letter</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {latestCoverLetter.title}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCoverLetterPreview(true)}
                          className="h-7 text-xs w-full justify-start"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Preview Cover Letter
                        </Button>
                      </div>
                    )}
                    
                    {/* Generate Cover Letter Option */}
                    {hasOptimizedResume && !hasCoverLetter && (
                      <DropdownMenuItem onClick={() => setShowCoverLetterGenerationModal(true)} className="py-2">
                        <Mail className="h-4 w-4 mr-2" />
                        Generate Cover Letter
                      </DropdownMenuItem>
                    )}
                    
                    {/* Full Stack Preview */}
                    {hasCompleteStack && (
                      <DropdownMenuItem onClick={() => setShowStackModal(true)} className="py-2">
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Stack
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateStackModal(true)}
                  className="h-8 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Stack
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
                  {job.job_url && (
                    <DropdownMenuItem onClick={() => window.open(job.job_url!, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Job Posting
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate(`/upload-resume?jobId=${job.id}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Optimize Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowCoverLetterGenerationModal(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Generate Cover Letter
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate(`/upload-job?edit=${job.id}`)}
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

      {/* Cover Letter Generation Modal */}
      <CoverLetterGenerationModal 
        isOpen={showCoverLetterGenerationModal}
        onClose={() => setShowCoverLetterGenerationModal(false)}
        job={job}
        onComplete={() => {
          setShowCoverLetterGenerationModal(false);
          onRefresh();
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
            navigate(`/resume-editor/${latestResume.id}`);
          }}
        />
      )}

      {/* Cover Letter Preview Modal */}
      {latestCoverLetter && showCoverLetterPreview && (
        <ContentPreview
          content={latestCoverLetter.generated_text}
          title={latestCoverLetter.title}
          type="cover-letter"
          onClose={() => setShowCoverLetterPreview(false)}
        />
      )}
    </>
  );
};