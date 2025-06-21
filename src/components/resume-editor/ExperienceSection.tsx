
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Plus, Trash2, ListOrdered, Sparkles, X } from 'lucide-react';
import { BulletSuggestionsModal } from './BulletSuggestionsModal';

interface Experience {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

interface ExperienceSectionProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
  jobDescriptionId?: string;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  onChange,
  jobDescriptionId
}) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    experienceIndex: number;
    companyName: string;
    role: string;
    currentBullets: string[];
  }>({
    isOpen: false,
    experienceIndex: -1,
    companyName: '',
    role: '',
    currentBullets: []
  });

  const addExperience = () => {
    const newExperience: Experience = {
      title: '',
      company: '',
      duration: '',
      bullets: ['']
    };
    onChange([...experiences, newExperience]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | string[]) => {
    onChange(experiences.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  const addBulletPoint = (experienceIndex: number) => {
    const experience = experiences[experienceIndex];
    if (experience) {
      const newBullets = [...experience.bullets, ''];
      updateExperience(experienceIndex, 'bullets', newBullets);
    }
  };

  const updateBulletPoint = (experienceIndex: number, bulletIndex: number, value: string) => {
    const experience = experiences[experienceIndex];
    if (experience) {
      const newBullets = experience.bullets.map((bullet, i) => 
        i === bulletIndex ? value : bullet
      );
      updateExperience(experienceIndex, 'bullets', newBullets);
    }
  };

  const removeBulletPoint = (experienceIndex: number, bulletIndex: number) => {
    const experience = experiences[experienceIndex];
    if (experience && experience.bullets.length > 1) {
      const newBullets = experience.bullets.filter((_, i) => i !== bulletIndex);
      updateExperience(experienceIndex, 'bullets', newBullets);
    }
  };

  const openAISuggestions = (experienceIndex: number) => {
    const experience = experiences[experienceIndex];
    if (experience && jobDescriptionId) {
      setModalState({
        isOpen: true,
        experienceIndex,
        companyName: experience.company,
        role: experience.title,
        currentBullets: experience.bullets
      });
    }
  };

  const handleSelectBullets = (bullets: string[]) => {
    const experience = experiences[modalState.experienceIndex];
    if (experience) {
      const newBullets = [...experience.bullets, ...bullets];
      updateExperience(modalState.experienceIndex, 'bullets', newBullets);
    }
    
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const hasOptimizedBullets = (bullets: string[]) => {
    const content = bullets.join(' ');
    return bullets.length > 2 && (
      content.length > 150 ||
      content.includes('%') ||
      content.includes('$') ||
      /\d+\+/.test(content) ||
      content.includes('Led') ||
      content.includes('Managed') ||
      content.includes('Implemented') ||
      content.includes('Achieved')
    );
  };

  return (
    <>
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
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                  {hasOptimizedBullets(experience.bullets) && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                      <Sparkles className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">AI Optimized</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(index)}
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
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Job Title
                  </label>
                  <Input
                    value={experience.title}
                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    placeholder="Job title"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Duration
                </label>
                <Input
                  value={experience.duration}
                  onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                  placeholder="Jan 2020 - Present"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Key Achievements & Responsibilities
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBulletPoint(index)}
                      className="text-xs"
                    >
                      <ListOrdered className="h-3 w-3 mr-1" />
                      Add Bullet
                    </Button>
                    {jobDescriptionId && experience.company && experience.title && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAISuggestions(index)}
                        className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggestions
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {experience.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <span className="text-gray-500 mt-1">•</span>
                      <Textarea
                        value={bullet}
                        onChange={(e) => updateBulletPoint(index, bulletIndex, e.target.value)}
                        placeholder="Describe your achievement or responsibility..."
                        className="flex-1 min-h-[60px] resize-none"
                      />
                      {experience.bullets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBulletPoint(index, bulletIndex)}
                          className="mt-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 space-y-1">
                  {hasOptimizedBullets(experience.bullets) ? (
                    <div className="space-y-1">
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI-optimized content with strategic keywords and metrics detected
                      </p>
                      <p className="text-xs text-blue-600">
                        ✅ Ready for ATS systems with quantified achievements
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        💡 Include metrics and quantifiable results for maximum impact
                      </p>
                      <p className="text-xs text-blue-600">
                        📝 Use action verbs like "Led", "Managed", "Achieved" to start bullet points
                      </p>
                    </div>
                  )}
                </div>
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

      <BulletSuggestionsModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        experienceId={modalState.experienceIndex.toString()}
        jobDescriptionId={jobDescriptionId || ''}
        companyName={modalState.companyName}
        role={modalState.role}
        currentDescription={modalState.currentBullets.join('\n')}
        onSelectBullets={handleSelectBullets}
      />
    </>
  );
};
