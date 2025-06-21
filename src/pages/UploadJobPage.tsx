
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, Loader2, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseDocument } from '@/utils/documentParser';
import { useNavigate } from 'react-router-dom';

const UploadJobPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedContent, setParsedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('file');
  const { toast } = useToast();
  const navigate = useNavigate();

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    if (selectedFile.size > maxFileSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    const fileExtension = selectedFile.name.toLowerCase();
    if (!fileExtension.endsWith('.pdf') && !fileExtension.endsWith('.docx')) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF or DOCX file.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      setIsProcessing(true);
      const parsedText = await parseDocument(selectedFile);
      setParsedContent(parsedText);
      setShowPreview(true);
    } catch (error) {
      console.error('Error parsing document:', error);
      toast({
        title: "Parse Error",
        description: "Could not parse the document. Please try a different file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast({
        title: "Empty Content",
        description: "Please enter some text content.",
        variant: "destructive"
      });
      return;
    }

    if (!jobTitle.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a job title.",
        variant: "destructive"
      });
      return;
    }

    setParsedContent(textInput);
    setShowPreview(true);
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${userId}/job-descriptions/${fileName}`;

    const { error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleConfirmSave = async () => {
    if (!parsedContent) return;

    try {
      setIsProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to save job descriptions.",
          variant: "destructive"
        });
        return;
      }

      let fileUrl: string | undefined;

      if (file) {
        try {
          fileUrl = await uploadFileToStorage(file, user.id);
        } catch (storageError) {
          console.log('Storage upload failed, proceeding without file URL:', storageError);
        }
      }

      const { error } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          title: jobTitle || file?.name || 'Untitled Job Description',
          source_file_url: fileUrl || null,
          parsed_text: parsedContent,
          file_name: file?.name || null,
          file_size: file?.size || null
        });

      if (error) throw error;

      toast({
        title: "Saved Successfully",
        description: "Your job description has been saved successfully.",
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your job description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setFile(null);
    setTextInput('');
    setJobTitle('');
    setParsedContent('');
    setShowPreview(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Job Description</h1>
          <p className="text-gray-600">
            Upload a job description file or paste the text directly
          </p>
        </div>

        {!showPreview ? (
          <Card>
            <CardHeader>
              <CardTitle>Job Title</CardTitle>
              <CardDescription>Enter the job title for this position</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mb-6"
              />

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                  <TabsTrigger value="text">Paste Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="space-y-4">
                  <div
                    className={`
                      relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors
                      ${isDragOver 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Drag and drop job description file here
                    </h3>
                    <p className="text-gray-600 mb-6">
                      or click below to select a file
                    </p>
                    
                    <Input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="job-upload"
                    />
                    <Button asChild>
                      <label htmlFor="job-upload" className="cursor-pointer">
                        <FileText className="h-4 w-4 mr-2" />
                        Choose File
                      </label>
                    </Button>
                    
                    <p className="text-sm text-gray-500 mt-4">
                      Supported formats: PDF, DOCX (max 10MB)
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-4">
                    <Label htmlFor="job-text">Job Description Text</Label>
                    <Textarea
                      id="job-text"
                      placeholder="Paste the job description text here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={12}
                      className="resize-none"
                    />
                    <Button 
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim() || !jobTitle.trim()}
                      className="w-full"
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Preview Job Description
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Job description processed successfully!</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartOver}
                  >
                    Start Over
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {jobTitle || file?.name || 'Job Description'}
                </CardTitle>
                <CardDescription>
                  Preview of your job description content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto mb-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {parsedContent}
                  </pre>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={handleConfirmSave}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm & Save Job Description
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleStartOver}
                    disabled={isProcessing}
                  >
                    {activeTab === 'file' ? 'Upload Different File' : 'Edit Text'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isProcessing && !showPreview && (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">
                {activeTab === 'file' ? 'Processing your file...' : 'Processing your text...'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadJobPage;
