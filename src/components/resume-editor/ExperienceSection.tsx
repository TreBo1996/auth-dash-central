import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Plus, Trash2, ListOrdered, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import { AISuggestionsModal } from './AISuggestionsModal';


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
  showOptimizedBadges?: boolean;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  onChange,
  jobDescriptionId,
  showOptimizedBadges = true
}) => {

  const [aiSuggestionsModal, setAiSuggestionsModal] = useState<{
    isOpen: boolean;
    experienceIndex: number;
    companyName: string;
    role: string;
    currentDescription: string;
  }>({
    isOpen: false,
    experienceIndex: -1,
    companyName: '',
    role: '',
    currentDescription: ''
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

  const moveExperienceUp = (index: number) => {
    if (index > 0) {
      const newExperiences = [...experiences];
      [newExperiences[index - 1], newExperiences[index]] = [newExperiences[index], newExperiences[index - 1]];
      onChange(newExperiences);
    }
  };

  const moveExperienceDown = (index: number) => {
    if (index < experiences.length - 1) {
      const newExperiences = [...experiences];
      [newExperiences[index], newExperiences[index + 1]] = [newExperiences[index + 1], newExperiences[index]];
      onChange(newExperiences);
    }
  };

  const addBulletPoint = (experienceIndex: number) => {
    const experience = experiences[experienceIndex];
    if (experience) {
      const currentBullets = experience.bullets || [];
      const newBullets = [...currentBullets, ''];
      updateExperience(experienceIndex, 'bullets', newBullets);
    }
  };

  const updateBulletPoint = (experienceIndex: number, bulletIndex: number, value: string) => {
    const experience = experiences[experienceIndex];
    if (experience) {
      const currentBullets = experience.bullets || [];
      const newBullets = currentBullets.map((bullet, i) => 
        i === bulletIndex ? value : bullet
      );
      updateExperience(experienceIndex, 'bullets', newBullets);
    }
  };

  const removeBulletPoint = (experienceIndex: number, bulletIndex: number) => {
    const experience = experiences[experienceIndex];
    if (experience) {
      const currentBullets = experience.bullets || [];
      if (currentBullets.length > 1) {
        const newBullets = currentBullets.filter((_, i) => i !== bulletIndex);
        updateExperience(experienceIndex, 'bullets', newBullets);
      }
    }
  };


  const openAIExperienceSuggestions = (experienceIndex: number) => {
    const experience = experiences[experienceIndex];
    if (experience && jobDescriptionId) {
      setAiSuggestionsModal({
        isOpen: true,
        experienceIndex,
        companyName: experience.company,
        role: experience.title,
        currentDescription: experience.bullets.join('\n')
      });
    }
  };


  const handleSelectSuggestions = (suggestions: string[]) => {
    const experience = experiences[aiSuggestionsModal.experienceIndex];
    if (experience) {
      const currentBullets = experience.bullets || [];
      const newBullets = [...currentBullets, ...suggestions];
      updateExperience(aiSuggestionsModal.experienceIndex, 'bullets', newBullets);
    }
    
    setAiSuggestionsModal(prev => ({ ...prev, isOpen: false }));
  };

  const hasOptimizedBullets = (bullets: string[]) => {
    // Ensure bullets is always an array before processing
    const safeBullets = bullets || [];
    const content = safeBullets.join(' ');
    return safeBullets.length > 2 && (
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

  // Ensure all experiences have proper bullets arrays
  const safeExperiences = experiences.map(exp => ({
    ...exp,
    bullets: exp.bullets || ['']
  }));

  return (
    <>
      <Card className="rounded-xl shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
            <Button onClick={addExperience} size="sm" className="self-start sm:self-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {safeExperiences.map((experience, index) => (
            <div key={index} className="p-3 sm:p-4 border rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">Experience {index + 1}</h4>
                  {showOptimizedBadges && hasOptimizedBullets(experience.bullets) && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full self-start">
                      <Sparkles className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">AI Optimized</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveExperienceUp(index)}
                    disabled={index === 0}
                    className="p-2 h-8 w-8"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveExperienceDown(index)}
                    disabled={index === safeExperiences.length - 1}
                    className="p-2 h-8 w-8"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
                    className="p-2 h-8 w-8 text-red-500 hover:text-red-700"
                    title="Delete experience"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Company
                  </label>
                  <Input
                    value={experience.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder="Company name"
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Job Title
                  </label>
                  <Input
                    value={experience.title}
                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    placeholder="Job title"
                    className="h-11"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Duration
                </label>
                <Input
                  value={experience.duration}
                  onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                  placeholder="Jan 2020 - Present"
                  className="h-11"
                />
              </div>
              
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Key Achievements & Responsibilities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBulletPoint(index)}
                      className="text-xs h-8"
                    >
                      <ListOrdered className="h-3 w-3 mr-1" />
                      Add Bullet
                    </Button>
                    {jobDescriptionId && experience.company && experience.title && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAIExperienceSuggestions(index)}
                        className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 h-8"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Job-Fit Ideas
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {experience.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <span className="text-gray-500 mt-2 text-sm">•</span>
                      <Textarea
                        value={bullet}
                        onChange={(e) => updateBulletPoint(index, bulletIndex, e.target.value)}
                        placeholder="Describe your achievement or responsibility..."
                        className="flex-1 resize-none min-h-[70px] text-sm"
                      />
                      {experience.bullets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBulletPoint(index, bulletIndex)}
                          className="mt-1 p-2 h-8 w-8"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 space-y-1">
                  {showOptimizedBadges && hasOptimizedBullets(experience.bullets) ? (
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
          
          {safeExperiences.length === 0 && (
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

      <AISuggestionsModal
        isOpen={aiSuggestionsModal.isOpen}
        onClose={() => setAiSuggestionsModal(prev => ({ ...prev, isOpen: false }))}
        experienceId={aiSuggestionsModal.experienceIndex.toString()}
        jobDescriptionId={jobDescriptionId || ''}
        companyName={aiSuggestionsModal.companyName}
        role={aiSuggestionsModal.role}
        currentDescription={aiSuggestionsModal.currentDescription}
        onSelectSuggestions={handleSelectSuggestions}
      />
    </>
  );
};
