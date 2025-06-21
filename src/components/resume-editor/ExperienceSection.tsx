
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ExperienceSectionProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  onChange
}) => {
  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    onChange([...experiences, newExperience]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    onChange(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    onChange(experiences.filter(exp => exp.id !== id));
  };

  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </CardTitle>
          <Button onClick={addExperience} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {experiences.map((experience, index) => (
          <div key={experience.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeExperience(experience.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Company
                </label>
                <Input
                  value={experience.company}
                  onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Job Title
                </label>
                <Input
                  value={experience.role}
                  onChange={(e) => updateExperience(experience.id, 'role', e.target.value)}
                  placeholder="Job title"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Start Date
                </label>
                <Input
                  value={experience.startDate}
                  onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                  placeholder="MM/YYYY"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  End Date
                </label>
                <Input
                  value={experience.endDate}
                  onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                  placeholder="MM/YYYY or Present"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Job Description
              </label>
              <Textarea
                value={experience.description}
                onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                placeholder="Describe your responsibilities and achievements..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        ))}
        
        {experiences.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No work experience added yet</p>
            <Button onClick={addExperience} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Experience
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
