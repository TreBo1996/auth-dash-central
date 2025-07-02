
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Edit, Save, Download, Copy } from 'lucide-react';

interface CoverLetter {
  id: string;
  title: string;
  generated_text: string;
  created_at: string;
  updated_at: string;
  job_description: {
    title: string;
    company: string;
  } | null;
}

interface CoverLetterPreviewProps {
  coverLetter: CoverLetter;
  onClose: () => void;
  onSave: () => void;
}

export const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({
  coverLetter,
  onClose,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(coverLetter.title);
  const [editedContent, setEditedContent] = useState(coverLetter.generated_text);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cover_letters')
        .update({
          title: editedTitle,
          generated_text: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', coverLetter.id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Cover letter updated successfully."
      });

      setIsEditing(false);
      onSave();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(coverLetter.title);
    setEditedContent(coverLetter.generated_text);
    setIsEditing(false);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([editedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${editedTitle}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    toast({
      title: "Copied",
      description: "Cover letter copied to clipboard."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cover Letters
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cover Letter Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
            ) : (
              editedTitle
            )}
          </CardTitle>
          {coverLetter.job_description && (
            <p className="text-sm text-muted-foreground">
              For: {coverLetter.job_description.title}
              {coverLetter.job_description.company && ` at ${coverLetter.job_description.company}`}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Created: {new Date(coverLetter.created_at).toLocaleDateString()}
            {coverLetter.updated_at !== coverLetter.created_at && (
              <span> • Updated: {new Date(coverLetter.updated_at).toLocaleDateString()}</span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
              {editedContent}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
