
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
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
  const { toast } = useToast();

  const acceptedFileTypes = '.pdf,.docx';
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

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
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${userId}/${type === 'resume' ? 'resumes' : 'job-descriptions'}/${fileName}`;

    const { error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveToDatabase = async (userId: string, fileUrl?: string) => {
    if (type === 'resume') {
      const { error } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          original_file_url: fileUrl || null,
          parsed_text: parsedContent,
          file_name: file?.name || null,
          file_size: file?.size || null
        });

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: userId,
          title: jobTitle || file?.name || 'Untitled Job Description',
          source_file_url: fileUrl || null,
          parsed_text: parsedContent,
          file_name: file?.name || null,
          file_size: file?.size || null
        });

      if (error) throw error;
    }
  };

  const handleUpload = async () => {
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

      if (file) {
        fileUrl = await uploadFileToStorage(file, user.id);
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
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      console.error('Upload error:', error);
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
                <p className="font-medium">Content Preview:</p>
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
