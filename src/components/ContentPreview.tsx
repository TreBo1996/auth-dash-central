
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Mail, Edit } from 'lucide-react';

interface ContentPreviewProps {
  content: string;
  title: string;
  type: 'resume' | 'job-description' | 'cover-letter';
  onClose: () => void;
  onEdit?: () => void;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  title,
  type,
  onClose,
  onEdit
}) => {
  const getIcon = () => {
    switch (type) {
      case 'cover-letter':
        return <Mail className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'cover-letter':
        return 'Preview of your cover letter content';
      case 'resume':
        return 'Preview of your resume content';
      case 'job-description':
        return 'Preview of your job description content';
      default:
        return 'Preview of your content';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        </ScrollArea>
        
        {onEdit && (
          <DialogFooter>
            <Button onClick={onEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
