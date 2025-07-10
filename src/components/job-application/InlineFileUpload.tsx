import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseDocument } from '@/utils/documentParser';

interface InlineFileUploadProps {
  onUploadSuccess: (resumeId: string) => void;
  onCancel: () => void;
}

export const InlineFileUpload: React.FC<InlineFileUploadProps> = ({ 
  onUploadSuccess, 
  onCancel 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedContent, setParsedContent] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const { toast } = useToast();

  const acceptedFileTypes = '.pdf,.docx';
  const maxFileSize = 10 * 1024 * 1024; // 10MB

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
    setIsParsingFile(true);
    
    try {
      console.log('Starting document parsing for:', selectedFile.name);
      const parsedText = await parseDocument(selectedFile);
      console.log('Document parsed successfully, length:', parsedText.length);
      setParsedContent(parsedText);
    } catch (error) {
      console.error('Error parsing document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(`Parse error: ${errorMessage}`);
      
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
    } finally {
      setIsParsingFile(false);
    }
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
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
  };

  const saveToDatabase = async (userId: string, fileUrl?: string) => {
    console.log('Starting database save for user:', userId);
    
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
  };

  const handleUpload = async () => {
    if (!parsedContent) {
      toast({
        title: "No content to upload",
        description: "Please select a file first.",
        variant: "destructive"
      });
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    
    try {
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
        description: "Your resume has been uploaded and is ready for optimization.",
      });

      // Call success callback with the new resume ID
      onUploadSuccess(savedRecord.id);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upload Resume</h3>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

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

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select Resume File</Label>
          <Input
            id="file-upload"
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            className="cursor-pointer"
            disabled={isParsingFile || isUploading}
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
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>✨ AI-Powered:</strong> Your resume will be automatically parsed and ready for optimization.
            </p>
          </div>
        </div>

        {isParsingFile && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="flex items-center gap-2">
                <span>Parsing document...</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {parsedContent && !isParsingFile && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Document parsed successfully! ({parsedContent.length} characters)</p>
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading & Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Resume
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};