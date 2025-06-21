
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

interface ContentPreviewProps {
  content: string;
  title: string;
  type: 'resume' | 'job-description';
  onClose: () => void;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  title,
  type,
  onClose
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Preview of your {type === 'resume' ? 'resume' : 'job description'} content
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
