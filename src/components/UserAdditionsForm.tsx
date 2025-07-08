import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

export interface UserAddition {
  id: string;
  addition_type: 'skill' | 'experience' | 'achievement';
  content: string;
  target_experience_title: string;
  target_experience_company?: string;
}

interface Experience {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

interface UserAdditionsFormProps {
  experiences: Experience[];
  additions: UserAddition[];
  onAdditionsChange: (additions: UserAddition[]) => void;
}

export const UserAdditionsForm: React.FC<UserAdditionsFormProps> = ({
  experiences,
  additions,
  onAdditionsChange
}) => {
  const [newAddition, setNewAddition] = useState<{
    addition_type: 'skill' | 'experience' | 'achievement';
    content: string;
    target_experience_title: string;
    target_experience_company: string;
  }>({
    addition_type: 'experience',
    content: '',
    target_experience_title: '',
    target_experience_company: ''
  });

  const addUserAddition = () => {
    if (!newAddition.content.trim() || !newAddition.target_experience_title) {
      return;
    }

    const targetExperience = experiences.find(exp => exp.title === newAddition.target_experience_title);
    
    const addition: UserAddition = {
      id: crypto.randomUUID(),
      addition_type: newAddition.addition_type,
      content: newAddition.content.trim(),
      target_experience_title: newAddition.target_experience_title,
      target_experience_company: targetExperience?.company || newAddition.target_experience_company
    };

    onAdditionsChange([...additions, addition]);
    setNewAddition({
      addition_type: 'experience',
      content: '',
      target_experience_title: '',
      target_experience_company: ''
    });
  };

  const removeAddition = (id: string) => {
    onAdditionsChange(additions.filter(a => a.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Missing Experiences or Skills</CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on the ATS analysis, you can add any relevant experiences or skills you have that might improve your score.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Addition Form */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={newAddition.addition_type} 
                onValueChange={(value: 'skill' | 'experience' | 'achievement') => 
                  setNewAddition(prev => ({ ...prev, addition_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="experience">Experience/Responsibility</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Add to Role</label>
              <Select 
                value={newAddition.target_experience_title} 
                onValueChange={(value) => {
                  const experience = experiences.find(exp => exp.title === value);
                  setNewAddition(prev => ({ 
                    ...prev, 
                    target_experience_title: value,
                    target_experience_company: experience?.company || ''
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to enhance" />
                </SelectTrigger>
                <SelectContent>
                  {experiences.map((exp, index) => (
                    <SelectItem key={index} value={exp.title}>
                      {exp.title} at {exp.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {newAddition.addition_type === 'skill' 
                ? 'Skill or Technology' 
                : newAddition.addition_type === 'achievement'
                ? 'Achievement or Result'
                : 'Experience or Responsibility'
              }
            </label>
            <Textarea
              value={newAddition.content}
              onChange={(e) => setNewAddition(prev => ({ ...prev, content: e.target.value }))}
              placeholder={
                newAddition.addition_type === 'skill' 
                  ? 'e.g., Python, AWS, Agile methodology'
                  : newAddition.addition_type === 'achievement'
                  ? 'e.g., Increased team productivity by 25%'
                  : 'e.g., Led cross-functional team of 8 members to deliver project 2 weeks ahead of schedule'
              }
              rows={3}
            />
          </div>

          <Button onClick={addUserAddition} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add to Resume
          </Button>
        </div>

        {/* Preview of Added Items */}
        {additions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Your Additions:</h4>
            {additions.map((addition) => (
              <div key={addition.id} className="flex items-start justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {addition.addition_type}
                    </Badge>
                    <span className="text-sm font-medium">
                      → {addition.target_experience_title}
                      {addition.target_experience_company && ` at ${addition.target_experience_company}`}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{addition.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAddition(addition.id)}
                  className="ml-2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};