
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Plus, X } from 'lucide-react';

interface SkillsSectionProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  onChange
}) => {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onChange([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Skills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a skill..."
            className="flex-1"
          />
          <Button onClick={addSkill} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1">
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No skills added yet</p>
            <p className="text-sm">Start typing to add your skills</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
