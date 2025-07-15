import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Search, 
  Upload,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

interface StackPrerequisitesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasResume: boolean;
  hasJobDescriptions: boolean;
}

export const StackPrerequisitesModal: React.FC<StackPrerequisitesModalProps> = ({
  open,
  onOpenChange,
  hasResume,
  hasJobDescriptions
}) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const getModalContent = () => {
    if (!hasResume && !hasJobDescriptions) {
      return {
        title: "Create Your First Application Stack",
        description: "To create application stacks, you need both a resume and job descriptions to optimize against.",
        icon: Layers,
        iconColor: "text-purple-500",
        content: (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">What You Need:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Your resume (PDF/DOCX format)</li>
                    <li>• Job descriptions to optimize against</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Button 
                onClick={() => handleNavigation('/upload-resume')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your Resume First
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Then you can add job descriptions
              </div>
            </div>
          </>
        )
      };
    }

    if (!hasResume && hasJobDescriptions) {
      return {
        title: "Upload Your Resume",
        description: "You have job descriptions saved, but need to upload your resume to create optimized application stacks.",
        icon: FileText,
        iconColor: "text-blue-500",
        content: (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Once you upload your resume, you can create personalized application stacks for your saved job descriptions. This will optimize your resume and generate custom cover letters for each position.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => handleNavigation('/upload-resume')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Your Resume
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )
      };
    }

    if (hasResume && !hasJobDescriptions) {
      return {
        title: "Add Job Descriptions",
        description: "You have a resume uploaded, but need job descriptions to create targeted application stacks.",
        icon: Search,
        iconColor: "text-green-500",
        content: (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Add job descriptions by searching our database or uploading job postings manually. This allows us to optimize your resume and create targeted cover letters for each position.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Button 
                onClick={() => handleNavigation('/job-search')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Job Database
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => handleNavigation('/upload-job')}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Job Description
              </Button>
            </div>
          </>
        )
      };
    }

    return null;
  };

  const modalContent = getModalContent();

  if (!modalContent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <modalContent.icon className={`h-5 w-5 ${modalContent.iconColor}`} />
            {modalContent.title}
          </DialogTitle>
          <DialogDescription>
            {modalContent.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {modalContent.content}
        </div>
      </DialogContent>
    </Dialog>
  );
};