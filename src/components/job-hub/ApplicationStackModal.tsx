import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Mail, 
  Award, 
  Calendar,
  Download,
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
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
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
                          onClick={() => setActiveTab('resume')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => window.location.href = `/resume-editor/${resume.id}`}
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
                  {coverLetter && (
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
                          onClick={() => setActiveTab('cover-letter')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => window.location.href = `/cover-letters?edit=${coverLetter.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stack Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Application Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
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
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Download both files
                      toast({
                        title: "Download Started",
                        description: "Your application stack is being prepared for download."
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Stack
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resume Preview</span>
                  {resume?.ats_score && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {resume.ats_score}% ATS Score
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg min-h-[400px]">
                  <p className="text-center text-gray-500">
                    Resume preview would be displayed here
                  </p>
                  {/* TODO: Integrate with actual resume preview component */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cover-letter" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg min-h-[400px]">
                  {coverLetter ? (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-sm">
                        {coverLetter.generated_text || 'Cover letter content would be displayed here'}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">
                      No cover letter available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};