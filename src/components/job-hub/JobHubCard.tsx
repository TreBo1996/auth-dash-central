import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { JobStatusSelector, ApplicationStatus } from './JobStatusSelector';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  MoreHorizontal,
  Trash2
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
    application_status?: ApplicationStatus;
    optimized_resumes?: any[];
    cover_letters?: any[];
  };
  onStatusUpdate: (jobId: string, field: string, value: boolean | ApplicationStatus) => void;
  onRefresh: () => void;
  onDelete: (jobId: string) => void;
}

export const JobHubCard: React.FC<JobHubCardProps> = ({ job, onStatusUpdate, onRefresh, onDelete }) => {
  const navigate = useNavigate();
  const [showStackModal, setShowStackModal] = useState(false);
  const [showCreateStackModal, setShowCreateStackModal] = useState(false);
  const [showCoverLetterGenerationModal, setShowCoverLetterGenerationModal] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(job.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting job:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600">
        <CardContent className="p-3 sm:p-4">
          {/* Mobile Layout - Vertical Stack */}
          <div className="block sm:hidden space-y-3">
            {/* Top Row: Job Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-base text-gray-900 leading-tight flex-1 pr-2">
                  {job.title}
                </h3>
              </div>
              
              <div className="space-y-1">
                {job.company && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Building className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
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
            </div>

            {/* Middle Row: Status and Stack Info */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <JobStatusSelector
                  status={job.application_status || 'pending'}
                  onStatusChange={(status) => onStatusUpdate(job.id, 'application_status', status)}
                />
              </div>
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-full">
                <div className={`w-2 h-2 rounded-full ${stackStatus.color}`} />
                <span className={`text-xs font-medium ${stackStatus.textColor}`}>
                  {stackStatus.text}
                </span>
                {hasOptimizedResume && latestResume?.ats_score && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4 ml-1">
                    {latestResume.ats_score}%
                  </Badge>
                )}
              </div>
              <Badge variant={job.source === 'upload' ? 'secondary' : 'default'} className="text-xs px-2 py-0.5">
                {job.source === 'upload' ? 'Ext' : 'RezLit'}
              </Badge>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(job.created_at)}
              </div>
            </div>

            {/* Bottom Row: Actions */}
            <div className="flex gap-2">
              {(hasOptimizedResume || hasCoverLetter) ? (
                <Button 
                  size="sm" 
                  onClick={() => setShowStackModal(true)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview Stack
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateStackModal(true)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm"
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
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden sm:flex items-center justify-between gap-4">
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
              </div>
            </div>

            {/* Center Section: Status Controls */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="min-w-[160px]">
                <JobStatusSelector
                  status={job.application_status || 'pending'}
                  onStatusChange={(status) => onStatusUpdate(job.id, 'application_status', status)}
                />
              </div>

              {/* Stack Status - Fixed width for consistent alignment */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full min-w-[140px]">
                <div className={`w-2 h-2 rounded-full ${stackStatus.color}`} />
                <span className={`text-xs font-medium ${stackStatus.textColor}`}>
                  {stackStatus.text}
                </span>
                <div className="ml-auto">
                  {hasOptimizedResume && latestResume?.ats_score ? (
                    <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                      {latestResume.ats_score}%
                    </Badge>
                  ) : (
                    <div className="w-8 h-4" /> // Placeholder to maintain consistent spacing
                  )}
                </div>
              </div>

              <Badge variant={job.source === 'upload' ? 'secondary' : 'default'} className="text-xs">
                {job.source === 'upload' ? 'External' : 'RezLit Job'}
              </Badge>
              
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(job.created_at)}
              </div>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {(hasOptimizedResume || hasCoverLetter) ? (
                <Button 
                  size="sm" 
                  onClick={() => setShowStackModal(true)}
                  className="h-8 w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview Stack
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateStackModal(true)}
                  className="h-8 w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
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
          // Refresh the job data to show updated stack status
          onRefresh();
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{job.title}" from your job pipeline? This action will permanently remove:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>The job description</li>
                {hasOptimizedResume && <li>Optimized resumes ({job.optimized_resumes?.length})</li>}
                {hasCoverLetter && <li>Cover letters ({job.cover_letters?.length})</li>}
                <li>Any interview sessions and responses</li>
              </ul>
              <p className="mt-2 font-medium text-red-600">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};