
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Plus, X, Trash2, Sparkles } from 'lucide-react';
import { SkillSuggestionsModal } from './SkillSuggestionsModal';

interface SkillGroup {
  category: string;
  items: string[];
}

interface SkillsSectionProps {
  skills: SkillGroup[];
  onChange: (skills: SkillGroup[]) => void;
  jobDescriptionId?: string;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  onChange,
  jobDescriptionId
}) => {
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillItem, setNewSkillItem] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Ensure skills is always an array
  const safeSkills = skills || [];

  const addSkillGroup = () => {
    if (newSkillCategory.trim()) {
      onChange([...safeSkills, { category: newSkillCategory.trim(), items: [] }]);
      setNewSkillCategory('');
    }
  };

  const removeSkillGroup = (index: number) => {
    onChange(safeSkills.filter((_, i) => i !== index));
  };

  const updateSkillCategory = (index: number, category: string) => {
    const updated = safeSkills.map((skill, i) => 
      i === index ? { ...skill, category } : skill
    );
    onChange(updated);
  };

  const addSkillItem = (groupIndex: number) => {
    if (newSkillItem.trim()) {
      const updated = safeSkills.map((skill, i) => 
        i === groupIndex 
          ? { ...skill, items: [...(skill.items || []), newSkillItem.trim()] }
          : skill
      );
      onChange(updated);
      setNewSkillItem('');
    }
  };

  const removeSkillItem = (groupIndex: number, itemIndex: number) => {
    const updated = safeSkills.map((skill, i) => 
      i === groupIndex 
        ? { ...skill, items: (skill.items || []).filter((_, j) => j !== itemIndex) }
        : skill
    );
    onChange(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleSkillSuggestions = (selectedSkills: { [category: string]: string[] }) => {
    const updatedSkills = [...safeSkills];
    
    Object.entries(selectedSkills).forEach(([categoryName, skillsList]) => {
      // Find existing category or create new one
      const existingCategoryIndex = updatedSkills.findIndex(
        group => group.category.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (existingCategoryIndex >= 0) {
        // Add to existing category, avoiding duplicates
        const existingItems = updatedSkills[existingCategoryIndex].items || [];
        const newItems = skillsList.filter(skill => 
          !existingItems.some(existing => existing.toLowerCase() === skill.toLowerCase())
        );
        updatedSkills[existingCategoryIndex].items = [...existingItems, ...newItems];
      } else {
        // Create new category
        updatedSkills.push({
          category: categoryName,
          items: skillsList
        });
      }
    });
    
    onChange(updatedSkills);
  };

  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Skills
          </CardTitle>
          <div className="flex gap-2">
            <Input
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addSkillGroup)}
              placeholder="Skill category..."
              className="w-40"
            />
            <Button onClick={addSkillGroup} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
            {jobDescriptionId && (
              <Button 
                onClick={() => setShowSuggestions(true)} 
                size="sm"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Suggestions
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skills optimization notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">
            💡 Skills Optimization Tip
          </p>
          <p className="text-sm text-blue-600">
            For optimal ATS compatibility and clean PDF presentation, we recommend focusing on your 4-6 most relevant skills. 
            Adding too many skills may affect resume formatting in certain templates.
          </p>
        </div>

        {safeSkills.map((skillGroup, groupIndex) => (
          <div key={groupIndex} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <Input
                value={skillGroup.category}
                onChange={(e) => updateSkillCategory(groupIndex, e.target.value)}
                className="font-medium"
                placeholder="Category name"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSkillGroup(groupIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newSkillItem}
                onChange={(e) => setNewSkillItem(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, () => addSkillItem(groupIndex))}
                placeholder="Add a skill..."
                className="flex-1"
              />
              <Button onClick={() => addSkillItem(groupIndex)} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(skillGroup.items || []).map((item, itemIndex) => (
                <Badge key={itemIndex} variant="secondary" className="px-3 py-1">
                  {item}
                  <button
                    onClick={() => removeSkillItem(groupIndex, itemIndex)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        ))}
        
        {safeSkills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No skill categories added yet</p>
            <p className="text-sm">Add categories like "Technical Skills", "Languages", etc.</p>
          </div>
        )}
      </CardContent>

      <SkillSuggestionsModal
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        jobDescriptionId={jobDescriptionId || ''}
        currentSkills={safeSkills}
        onSelectSkills={handleSkillSuggestions}
      />
    </Card>
  );
};
