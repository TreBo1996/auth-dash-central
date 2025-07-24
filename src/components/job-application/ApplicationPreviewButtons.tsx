
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { ResumeTemplateModal } from '@/components/job-hub/ResumeTemplateModal';
import { ContentPreview } from '@/components/ContentPreview';

interface ApplicationPreviewButtonsProps {
  resumeId?: string;
  coverLetter?: {
    id: string;
    title: string;
    generated_text: string;
    created_at: string;
  };
  onResumeEdit?: () => void;
  onCoverLetterEdit?: () => void;
  onCoverLetterDownload?: () => void;
}

export const ApplicationPreviewButtons: React.FC<ApplicationPreviewButtonsProps> = ({
  resumeId,
  coverLetter,
  onResumeEdit,
  onCoverLetterEdit,
  onCoverLetterDownload
}) => {
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);

  return (
    <div className="space-y-4">
      {/* Resume Preview Button */}
      {resumeId && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setShowResumePreview(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Resume
          </Button>
        </div>
      )}

      {/* Cover Letter Preview Button */}
      {coverLetter && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setShowCoverLetterPreview(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Cover Letter
          </Button>
        </div>
      )}

      {/* Resume Template Modal */}
      {resumeId && showResumePreview && (
        <ResumeTemplateModal
          isOpen={showResumePreview}
          onClose={() => setShowResumePreview(false)}
          optimizedResumeId={resumeId}
          onEdit={onResumeEdit}
        />
      )}

      {/* Cover Letter Preview Modal */}
      {coverLetter && showCoverLetterPreview && (
        <ContentPreview
          content={coverLetter.generated_text}
          title={coverLetter.title}
          type="cover-letter"
          onClose={() => setShowCoverLetterPreview(false)}
          onEdit={onCoverLetterEdit}
          onDownload={onCoverLetterDownload}
        />
      )}
    </div>
  );
};
