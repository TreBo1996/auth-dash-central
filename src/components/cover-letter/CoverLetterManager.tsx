
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Search, Eye, Edit, Trash2, Download } from 'lucide-react';
import { CoverLetterPreview } from './CoverLetterPreview';

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

interface CoverLetterManagerProps {
  refreshTrigger?: number;
}

export const CoverLetterManager: React.FC<CoverLetterManagerProps> = ({ refreshTrigger }) => {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<CoverLetter | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCoverLetters();
  }, [refreshTrigger]);

  const loadCoverLetters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cover_letters')
        .select(`
          id,
          title,
          generated_text,
          created_at,
          updated_at,
          job_description:job_descriptions(title, company)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoverLetters(data || []);
    } catch (error) {
      console.error('Error loading cover letters:', error);
      toast({
        title: "Error",
        description: "Failed to load cover letters. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return;

    try {
      const { error } = await supabase
        .from('cover_letters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCoverLetters(prev => prev.filter(cl => cl.id !== id));
      toast({
        title: "Deleted",
        description: "Cover letter deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      toast({
        title: "Error",
        description: "Failed to delete cover letter. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (coverLetter: CoverLetter) => {
    setSelectedCoverLetter(coverLetter);
    setShowPreview(true);
  };

  const handleDownload = (coverLetter: CoverLetter) => {
    const element = document.createElement('a');
    const file = new Blob([coverLetter.generated_text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${coverLetter.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredCoverLetters = coverLetters.filter(cl =>
    cl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cl.job_description?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cl.job_description?.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading cover letters...</p>
        </CardContent>
      </Card>
    );
  }

  if (showPreview && selectedCoverLetter) {
    return (
      <CoverLetterPreview
        coverLetter={selectedCoverLetter}
        onClose={() => {
          setShowPreview(false);
          setSelectedCoverLetter(null);
        }}
        onSave={() => {
          loadCoverLetters();
          setShowPreview(false);
          setSelectedCoverLetter(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Cover Letters
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cover letters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cover Letters List */}
        {filteredCoverLetters.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No cover letters match your search.' : 'No cover letters yet. Create your first one!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoverLetters.map((coverLetter) => (
              <Card key={coverLetter.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{coverLetter.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {coverLetter.job_description && (
                          <Badge variant="secondary">
                            {coverLetter.job_description.title}
                            {coverLetter.job_description.company && ` at ${coverLetter.job_description.company}`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(coverLetter.created_at).toLocaleDateString()}
                        {coverLetter.updated_at !== coverLetter.created_at && (
                          <span> • Updated: {new Date(coverLetter.updated_at).toLocaleDateString()}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {coverLetter.generated_text.slice(0, 150)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(coverLetter)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(coverLetter)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(coverLetter.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
