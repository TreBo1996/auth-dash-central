import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  jobDescriptionId: string;
  companyName: string;
  role: string;
  currentDescription: string;
  onSelectSuggestions: (suggestions: string[]) => void;
}

export const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  experienceId,
  jobDescriptionId,
  companyName,
  role,
  currentDescription,
  onSelectSuggestions
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      setSuggestions([]);
      
      const { data, error } = await supabase.functions.invoke('get-resume-suggestions', {
        body: {
          experienceId,
          jobDescriptionId,
          companyName,
          role,
          currentDescription
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error('No suggestions generated');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const addSelectedSuggestions = () => {
    const selected = suggestions.filter((_, index) => selectedSuggestions.has(index));
    onSelectSuggestions(selected);
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      generateSuggestions();
      setSelectedSuggestions(new Set());
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Resume Suggestions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Based on the job requirements for <strong>{role}</strong> at <strong>{companyName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Generating AI suggestions...</p>
              </div>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Select suggestions to add to your experience:</h4>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSuggestions.has(index)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSuggestion(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{suggestion}</p>
                      </div>
                      <div className="ml-3">
                        {selectedSuggestions.has(index) ? (
                          <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                            Selected
                          </Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedSuggestions.size} suggestion(s) selected
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={addSelectedSuggestions}
                    disabled={selectedSuggestions.size === 0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    Add Selected ({selectedSuggestions.size})
                  </Button>
                </div>
              </div>
            </>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No suggestions generated.</p>
              <Button 
                variant="outline" 
                onClick={generateSuggestions}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};