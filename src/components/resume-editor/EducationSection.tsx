
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

interface EducationSectionProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  onChange
}) => {
  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      year: ''
    };
    onChange([...education, newEducation]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const removeEducation = (id: string) => {
    onChange(education.filter(edu => edu.id !== id));
  };

  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
          <Button onClick={addEducation} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {education.map((edu, index) => (
          <div key={edu.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(edu.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Institution
                </label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                  placeholder="University or school name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Degree
                </label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                  placeholder="Degree or certification"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Graduation Year
                </label>
                <Input
                  value={edu.year}
                  onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                  placeholder="YYYY"
                />
              </div>
            </div>
          </div>
        ))}
        
        {education.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No education added yet</p>
            <Button onClick={addEducation} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
