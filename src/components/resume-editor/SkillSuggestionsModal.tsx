import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SkillCategory {
  category: string;
  skills: string[];
}

interface SkillSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobDescriptionId: string;
  currentSkills: Array<{ category: string; items: string[] }>;
  onSelectSkills: (selectedSkills: { [category: string]: string[] }) => void;
}

export const SkillSuggestionsModal: React.FC<SkillSuggestionsModalProps> = ({
  isOpen,
  onClose,
  jobDescriptionId,
  currentSkills,
  onSelectSkills
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      console.log('Requesting skill suggestions...');
      const { data, error } = await supabase.functions.invoke('generate-skill-suggestions', {
        body: {
          jobDescriptionId,
          currentSkills
        }
      });

      if (error) {
        console.error('Error generating suggestions:', error);
        throw error;
      }

      console.log('Received suggestions:', data);
      setSkillCategories(data.skillCategories || []);
    } catch (error) {
      console.error('Error generating skill suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate skill suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && skillCategories.length === 0) {
      generateSuggestions();
    }
  }, [isOpen]);

  const toggleSkillSelection = (skill: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skill)) {
      newSelected.delete(skill);
    } else {
      newSelected.add(skill);
    }
    setSelectedSkills(newSelected);
  };

  const handleAddSelected = () => {
    const skillsByCategory: { [category: string]: string[] } = {};
    
    skillCategories.forEach(category => {
      const selectedFromCategory = category.skills.filter(skill => selectedSkills.has(skill));
      if (selectedFromCategory.length > 0) {
        skillsByCategory[category.category] = selectedFromCategory;
      }
    });

    onSelectSkills(skillsByCategory);
    onClose();
  };

  const handleRegenerate = () => {
    setSkillCategories([]);
    setSelectedSkills(new Set());
    generateSuggestions();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI-Suggested Skills
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Select skills that are relevant to the job and that you actually possess
          </p>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Important:</strong> Only select skills you actually possess and can demonstrate. 
            Adding skills you don't have may hurt your credibility during interviews.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Generating personalized suggestions...</span>
            </div>
          ) : (
            <>
              {skillCategories.length > 0 && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Click to select skills ({selectedSkills.size} selected)
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

              <div className="space-y-6">
                {skillCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="space-y-3">
                    <h3 className="font-medium text-gray-900">{category.category}</h3>
                    <div className="space-y-2">
                      {category.skills.map((skill, skillIndex) => (
                        <div
                          key={`${categoryIndex}-${skillIndex}`}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedSkills.has(skill)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleSkillSelection(skill)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedSkills.has(skill)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedSkills.has(skill) && (
                                <Plus className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium">{skill}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {skillCategories.length === 0 && !loading && (
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
            disabled={selectedSkills.size === 0 || loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            Add {selectedSkills.size} Selected Skill{selectedSkills.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};