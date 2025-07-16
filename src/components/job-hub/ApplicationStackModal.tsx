import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ResumeTemplateModal } from './ResumeTemplateModal';
import { ContentPreview } from '@/components/ContentPreview';
import { 
  FileText, 
  Mail, 
  Award, 
  Calendar,
  Edit,
  Eye
} from 'lucide-react';

interface ApplicationStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string | null;
    source?: string | null;
  };
  resume: any;
  coverLetter: any;
}

export const ApplicationStackModal: React.FC<ApplicationStackModalProps> = ({
  isOpen,
  onClose,
  job,
  resume,
  coverLetter
}) => {
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResumeEdit = () => {
    setShowResumePreview(false);
    navigate(`/resume-editor/${resume.id}`);
  };

  const handleCoverLetterEdit = () => {
    setShowCoverLetterPreview(false);
    navigate('/cover-letters');
  };

  const handleCoverLetterDownload = () => {
    if (!coverLetter) return;
    
    const fileName = `cover-letter-${job.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${job.company?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'company'}-${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([coverLetter.generated_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Complete",
      description: "Cover letter has been downloaded successfully."
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Application Stack: {job.title}
          </DialogTitle>
          {job.company && (
            <p className="text-gray-600">{job.company}</p>
          )}
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Optimized Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resume && (
                  <>
                    <div>
                      <h4 className="font-medium">
                        Resume for {job.title} at {job.company}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {resume.ats_score}% ATS Score
                      </Badge>
                      {resume.job_fit_level && (
                        <Badge variant="outline">
                          {resume.job_fit_level} Fit
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Generated on {formatDate(resume.created_at)}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowResumePreview(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleResumeEdit}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Cover Letter Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Cover Letter
                </CardTitle>
              </CardHeader>
               <CardContent className="space-y-4">
                {coverLetter ? (
                  <>
                    <div>
                      <h4 className="font-medium">{coverLetter.title}</h4>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created on {formatDate(coverLetter.created_at)}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowCoverLetterPreview(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleCoverLetterEdit}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Cover letter not found or failed to generate
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => navigate('/cover-letters')}
                    >
                      Create Cover Letter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-medium">Ready to apply? Follow these steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click <strong>Preview</strong> on your resume and cover letter to review them</li>
                  <li>Make any final edits using the <strong>Edit</strong> buttons if needed</li>
                  <li>Download both documents using the download buttons in the preview modals</li>
                  <li>
                    {job.source === 'database' 
                      ? 'Apply directly using the button below' 
                      : 'Apply through the original job posting with your downloaded files'
                    }
                  </li>
                </ol>
              </div>
              
              {job.source === 'database' && (
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => {
                    // Navigate to application submission
                    window.location.href = `/job/database/${job.id}`;
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Apply with This Stack
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resume Template Modal */}
        {resume && showResumePreview && (
          <ResumeTemplateModal
            isOpen={showResumePreview}
            onClose={() => setShowResumePreview(false)}
            optimizedResumeId={resume.id}
            onEdit={handleResumeEdit}
          />
        )}

        {/* Cover Letter Preview Modal */}
        {coverLetter && showCoverLetterPreview && (
          <ContentPreview
            content={coverLetter.generated_text}
            title={coverLetter.title}
            type="cover-letter"
            onClose={() => setShowCoverLetterPreview(false)}
            onEdit={handleCoverLetterEdit}
            onDownload={handleCoverLetterDownload}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};