
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [companyName, setCompanyName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [parsedContent, setParsedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

    // Validate required fields for job descriptions before processing file
    if (type === 'job-description' && !jobTitle.trim()) {
      toast({
        title: "Missing Job Title",
        description: "Please enter a job title before uploading a file.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'job-description' && !companyName.trim()) {
      toast({
        title: "Missing Company Name",
        description: "Please enter a company name before uploading a file.",
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(`Parse error: ${errorMessage}`);
      
      // Show more helpful toast for PDF parsing failures
      if (errorMessage.includes('PDF parsing failed') || errorMessage.includes('poor quality results')) {
        toast({
          title: "PDF Parsing Failed",
          description: "This PDF couldn't be parsed properly. Please convert to DOCX format for best results.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Parse Error",
          description: "Could not parse the document. Please try a different file or convert to DOCX format.",
          variant: "destructive"
        });
      }
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
        title: "Missing Job Title",
        description: "Please enter a job title before proceeding.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'job-description' && !companyName.trim()) {
      toast({
        title: "Missing Company Name",
        description: "Please enter a company name before proceeding.",
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
      return data[0];
    } else {
      const insertData = {
        user_id: userId,
        title: jobTitle || file?.name || 'Untitled Job Description',
        company: companyName || null,
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
      return data[0];
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

      const savedRecord = await saveToDatabase(user.id, fileUrl);

      toast({
        title: "Upload Successful",
        description: `Your ${type.replace('-', ' ')} has been uploaded and will be processed with AI parsing.`,
      });

      // Reset form
      setFile(null);
      setTextInput('');
      setJobTitle('');
      setParsedContent('');
      setShowPreview(false);
      setUploadError(null);
      
      // Redirect to editor for resumes where AI parsing will happen
      if (type === 'resume' && savedRecord?.id) {
        navigate(`/resume-editor/initial/${savedRecord.id}`);
      } else if (onUploadSuccess) {
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
            ? 'Upload your resume in PDF or DOCX format (DOCX strongly recommended) - AI will automatically organize it into sections'
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
              <div className="whitespace-pre-line">{uploadError}</div>
              {uploadError.includes('PDF parsing failed') && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium text-blue-800 mb-1">Convert to DOCX:</p>
                  <p className="text-sm text-blue-700">Use Word, Google Docs, or online converters like SmallPDF</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {type === 'job-description' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title" className="flex items-center gap-1">
                Job Title
                <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground font-normal">(Required)</span>
              </Label>
              <Input
                id="job-title"
                placeholder="Enter job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={!jobTitle.trim() && showPreview ? "border-red-500 focus:ring-red-500" : ""}
              />
              {!jobTitle.trim() && showPreview && (
                <p className="text-sm text-red-600 mt-1">Job title is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name" className="flex items-center gap-1">
                Company Name
                <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground font-normal">(Required)</span>
              </Label>
              <Input
                id="company-name"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={!companyName.trim() && showPreview ? "border-red-500 focus:ring-red-500" : ""}
              />
              {!companyName.trim() && showPreview && (
                <p className="text-sm text-red-600 mt-1">Company name is required</p>
              )}
            </div>
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
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Supported: PDF, DOCX (max 10MB)</span>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  ✓ DOCX Best
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  ⚠ PDF Limited
                </span>
              </div>
            </div>
            {type === 'resume' && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>✨ AI-Powered:</strong> Your resume will be automatically parsed and organized into professional sections for easy editing.
                </p>
              </div>
            )}
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
                  disabled={!textInput.trim() || (type === 'job-description' && (!jobTitle.trim() || !companyName.trim()))}
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
                      {type === 'resume' ? 'Uploading & Processing with AI...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Confirm Upload {type === 'resume' ? '& Process with AI' : ''}
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
