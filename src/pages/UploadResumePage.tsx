import React, { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, Loader2, X, AlertTriangle } from 'lucide-react';
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
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication status on component mount
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('Auth check result:', { user: user?.id, error });
        
        if (error) {
          console.error('Auth error:', error);
          setAuthStatus('unauthenticated');
          return;
        }
        
        if (user) {
          setAuthStatus('authenticated');
          console.log('User authenticated:', user.id);
        } else {
          setAuthStatus('unauthenticated');
          console.log('No authenticated user found');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthStatus('unauthenticated');
      }
    };

    checkAuth();
  }, []);

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
    setUploadError(null);
    
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
        description: "Please select a PDF or DOCX file. DOCX format is recommended for best results.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    
    // Parse document immediately for preview
    try {
      setIsUploading(true);
      console.log('Starting document parsing for:', selectedFile.name);
      const parsedText = await parseDocument(selectedFile);
      console.log('Document parsed successfully, length:', parsedText.length);
      setParsedContent(parsedText);
      setShowPreview(true);
    } catch (error) {
      console.error('Error parsing document:', error);
      setUploadError(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Could not parse the document. Please try a different file.",
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

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('resumes')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Database test failed:', error);
        return false;
      }
      
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database test error:', error);
      return false;
    }
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `${userId}/resumes/${fileName}`;

      console.log('Attempting file upload to:', filePath);

      const { error } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      const { data } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully to:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      return null;
    }
  };

  const handleConfirmUpload = async () => {
    if (!file || !parsedContent) return;

    setUploadError(null);
    
    try {
      setIsUploading(true);

      // Test database connection first
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth check during upload:', { user: user?.id, authError });
      
      if (authError || !user) {
        console.error('Authentication failed during upload:', authError);
        setUploadError('Authentication failed. Please log in and try again.');
        toast({
          title: "Authentication Error",
          description: "Please log in to upload files.",
          variant: "destructive"
        });
        return;
      }

      console.log('Starting upload process for user:', user.id);

      // Try to upload file to storage (optional)
      let fileUrl: string | null = null;
      try {
        fileUrl = await uploadFileToStorage(file, user.id);
        if (fileUrl) {
          console.log('File storage successful');
        } else {
          console.log('File storage failed, continuing with parsed content only');
        }
      } catch (storageError) {
        console.log('Storage upload failed, proceeding without file URL:', storageError);
      }

      // Insert resume data into database
      console.log('Inserting resume data into database...');
      const insertData = {
        user_id: user.id,
        original_file_url: fileUrl,
        parsed_text: parsedContent,
        file_name: file.name,
        file_size: file.size
      };
      
      console.log('Insert data:', { ...insertData, parsed_text: `${parsedContent.length} characters` });

      const { data: insertResult, error: insertError } = await supabase
        .from('resumes')
        .insert(insertData)
        .select();

      if (insertError) {
        console.error('Database insert error:', insertError);
        setUploadError(`Database error: ${insertError.message}`);
        throw insertError;
      }

      console.log('Resume inserted successfully:', insertResult);

      toast({
        title: "Upload Successful",
        description: "Your resume has been uploaded successfully.",
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Upload process error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(`Upload failed: ${errorMessage}`);
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
    setUploadError(null);
  };

  // Show authentication status
  if (authStatus === 'checking') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to upload resumes. Please log in and try again.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Resume</h1>
          <p className="text-gray-600">
            Upload your resume in PDF or DOCX format to get started
          </p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg inline-block">
            💡 <strong>Tip:</strong> DOCX format is recommended for best parsing results
          </div>
        </div>

        {/* Show upload error if any */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {uploadError}
              {uploadError.includes('PDF') && (
                <div className="mt-2 text-sm">
                  <strong>Suggested solutions:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Convert your PDF to DOCX format using an online converter</li>
                    <li>Ensure your PDF is not password-protected or encrypted</li>
                    <li>Try a different PDF file if the current one is corrupted</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

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
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, DOCX (max 10MB)
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ DOCX Recommended
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      ⚠ PDF Support
                    </span>
                  </div>
                </div>
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
                  Preview of your resume content ({parsedContent.length} characters parsed)
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
