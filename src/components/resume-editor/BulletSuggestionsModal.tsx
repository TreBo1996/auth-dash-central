
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulletSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  jobDescriptionId: string;
  companyName: string;
  role: string;
  currentDescription: string;
  onSelectBullets: (bullets: string[]) => void;
}

export const BulletSuggestionsModal: React.FC<BulletSuggestionsModalProps> = ({
  isOpen,
  onClose,
  experienceId,
  jobDescriptionId,
  companyName,
  role,
  currentDescription,
  onSelectBullets
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [selectedBullets, setSelectedBullets] = useState<Set<number>>(new Set());

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      console.log('Requesting bullet suggestions...');
      const { data, error } = await supabase.functions.invoke('generate-bullet-suggestions', {
        body: {
          experienceId,
          jobDescriptionId,
          companyName,
          role,
          currentDescription
        }
      });

      if (error) {
        console.error('Error generating suggestions:', error);
        throw error;
      }

      console.log('Received suggestions:', data);
      setBulletPoints(data.bulletPoints || []);
    } catch (error) {
      console.error('Error generating bullet suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate bullet point suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bulletPoints.length === 0) {
      generateSuggestions();
    }
  }, [isOpen]);

  const toggleBulletSelection = (index: number) => {
    const newSelected = new Set(selectedBullets);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedBullets(newSelected);
  };

  const handleAddSelected = () => {
    const selectedBulletTexts = Array.from(selectedBullets).map(index => bulletPoints[index]);
    onSelectBullets(selectedBulletTexts);
    onClose();
  };

  const handleRegenerate = () => {
    setBulletPoints([]);
    setSelectedBullets(new Set());
    generateSuggestions();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI-Suggested Bullet Points
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Select the bullet points you'd like to add to your {role} experience at {companyName}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Generating personalized suggestions...</span>
            </div>
          ) : (
            <>
              {bulletPoints.length > 0 && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Click to select bullet points ({selectedBullets.size} selected)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {bulletPoints.map((bullet, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedBullets.has(index)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleBulletSelection(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedBullets.has(index)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedBullets.has(index) && (
                          <Plus className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <p className="text-sm leading-relaxed flex-1">{bullet}</p>
                    </div>
                  </div>
                ))}
              </div>

              {bulletPoints.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <p>No suggestions generated. Please try again.</p>
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    className="mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Try Again
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedBullets.size === 0 || loading}
          >
            Add {selectedBullets.size} Selected Bullet{selectedBullets.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
