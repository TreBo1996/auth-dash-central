
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseDocument } from '@/utils/documentParser';

interface FileUploadProps {
  type: 'resume' | 'job-description';
  onUploadSuccess?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ type, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [parsedContent, setParsedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  const acceptedFileTypes = '.pdf,.docx';
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const tableName = type === 'resume' ? 'resumes' : 'job_descriptions';
      const { data, error } = await supabase
        .from(tableName)
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setUploadError(null);

    if (selectedFile.size > maxFileSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    
    // Parse document immediately for preview
    try {
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
        description: "Could not parse the document. Please try a different file.",
        variant: "destructive"
      });
    }
  };

  const handleTextSubmit = () => {
    setUploadError(null);
    
    if (!textInput.trim()) {
      toast({
        title: "Empty Content",
        description: "Please enter some text content.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'job-description' && !jobTitle.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a job title.",
        variant: "destructive"
      });
      return;
    }

    setParsedContent(textInput);
    setShowPreview(true);
    console.log('Text content prepared for upload, length:', textInput.length);
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${userId}/${type === 'resume' ? 'resumes' : 'job-descriptions'}/${fileName}`;

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
  };

  const saveToDatabase = async (userId: string, fileUrl?: string) => {
    console.log('Starting database save for user:', userId);
    
    if (type === 'resume') {
      const insertData = {
        user_id: userId,
        original_file_url: fileUrl || null,
        parsed_text: parsedContent,
        file_name: file?.name || null,
        file_size: file?.size || null
      };
      
      console.log('Inserting resume data:', { ...insertData, parsed_text: `${parsedContent.length} characters` });

      const { data, error } = await supabase
        .from('resumes')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Resume insert error:', error);
        throw error;
      }
      
      console.log('Resume inserted successfully:', data);
    } else {
      const insertData = {
        user_id: userId,
        title: jobTitle || file?.name || 'Untitled Job Description',
        source_file_url: fileUrl || null,
        parsed_text: parsedContent,
        file_name: file?.name || null,
        file_size: file?.size || null
      };
      
      console.log('Inserting job description data:', { ...insertData, parsed_text: `${parsedContent.length} characters` });

      const { data, error } = await supabase
        .from('job_descriptions')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Job description insert error:', error);
        throw error;
      }
      
      console.log('Job description inserted successfully:', data);
    }
  };

  const handleUpload = async () => {
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

      let fileUrl: string | undefined;

      if (file) {
        try {
          fileUrl = await uploadFileToStorage(file, user.id);
        } catch (storageError) {
          console.log('Storage upload failed, proceeding without file URL:', storageError);
          // Continue without file URL - we still have the parsed content
        }
      }

      await saveToDatabase(user.id, fileUrl);

      toast({
        title: "Upload Successful",
        description: `Your ${type.replace('-', ' ')} has been uploaded successfully.`,
      });

      // Reset form
      setFile(null);
      setTextInput('');
      setJobTitle('');
      setParsedContent('');
      setShowPreview(false);
      setUploadError(null);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      console.error('Upload process error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(`Upload failed: ${errorMessage}`);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload {type === 'resume' ? 'Resume' : 'Job Description'}
        </CardTitle>
        <CardDescription>
          {type === 'resume' 
            ? 'Upload your resume in PDF or DOCX format'
            : 'Upload a job description file or paste the text directly'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show upload error if any */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {uploadError}
            </AlertDescription>
          </Alert>
        )}

        {type === 'job-description' && (
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              placeholder="Enter job title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <Input
              id="file-upload"
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, DOCX (max 10MB)
            </p>
          </div>

          {type === 'job-description' && (
            <>
              <div className="text-center text-muted-foreground">or</div>
              <div className="space-y-2">
                <Label htmlFor="text-input">Paste Text</Label>
                <Textarea
                  id="text-input"
                  placeholder="Paste the job description text here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={handleTextSubmit}
                  variant="outline"
                  disabled={!textInput.trim() || (!jobTitle.trim() && type === 'job-description')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Text
                </Button>
              </div>
            </>
          )}
        </div>

        {showPreview && parsedContent && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Content Preview ({parsedContent.length} characters):</p>
                <div className="max-h-32 overflow-y-auto text-sm bg-muted p-2 rounded">
                  {parsedContent.substring(0, 500)}
                  {parsedContent.length > 500 && '...'}
                </div>
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Confirm Upload
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
