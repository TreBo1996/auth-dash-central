
import React, { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseDocument } from '@/utils/documentParser';
import { useNavigate } from 'react-router-dom';

const UploadResumePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedContent, setParsedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const acceptedFileTypes = ['.pdf', '.docx'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  }, []);

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
    
    // Parse document immediately for preview
    try {
      setIsUploading(true);
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
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${userId}/resumes/${fileName}`;

    const { error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleConfirmUpload = async () => {
    if (!file || !parsedContent) return;

    try {
      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to upload files.",
          variant: "destructive"
        });
        return;
      }

      let fileUrl: string | undefined;

      try {
        fileUrl = await uploadFileToStorage(file, user.id);
      } catch (storageError) {
        console.log('Storage upload failed, proceeding without file URL:', storageError);
        // Continue without file URL - we still have the parsed content
      }

      const { error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          original_file_url: fileUrl || null,
          parsed_text: parsedContent,
          file_name: file.name,
          file_size: file.size
        });

      if (error) throw error;

      toast({
        title: "Upload Successful",
        description: "Your resume has been uploaded successfully.",
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartOver = () => {
    setFile(null);
    setParsedContent('');
    setShowPreview(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Resume</h1>
          <p className="text-gray-600">
            Upload your resume in PDF or DOCX format to get started
          </p>
        </div>

        {!showPreview ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-8">
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
                  Drag and drop your resume here
                </h3>
                <p className="text-gray-600 mb-6">
                  or click below to select a file
                </p>
                
                <Input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="resume-upload"
                />
                <Button asChild>
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Choose File
                  </label>
                </Button>
                
                <p className="text-sm text-gray-500 mt-4">
                  Supported formats: PDF, DOCX (max 10MB)
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Resume parsed successfully!</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartOver}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Start Over
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {file?.name}
                </CardTitle>
                <CardDescription>
                  Preview of your resume content
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
                    onClick={handleConfirmUpload}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving Resume...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm & Save Resume
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleStartOver}
                    disabled={isUploading}
                  >
                    Upload Different File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isUploading && !showPreview && (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Parsing your resume...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadResumePage;
