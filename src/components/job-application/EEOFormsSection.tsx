import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Shield } from 'lucide-react';

export interface EEOResponses {
  gender?: string;
  ethnicity?: string[];
  veteranStatus?: string;
  disabilityStatus?: string;
  selfIdentification?: string;
}

interface EEOFormsSectionProps {
  responses: EEOResponses;
  onResponsesChange: (responses: EEOResponses) => void;
}

export const EEOFormsSection: React.FC<EEOFormsSectionProps> = ({
  responses,
  onResponsesChange,
}) => {
  const handleGenderChange = (value: string) => {
    onResponsesChange({ ...responses, gender: value });
  };

  const handleEthnicityChange = (value: string, checked: boolean) => {
    const currentEthnicity = responses.ethnicity || [];
    let newEthnicity;

    if (value === 'prefer-not-to-answer') {
      newEthnicity = checked ? ['prefer-not-to-answer'] : [];
    } else {
      newEthnicity = checked
        ? [...currentEthnicity.filter(e => e !== 'prefer-not-to-answer'), value]
        : currentEthnicity.filter(e => e !== value);
    }

    onResponsesChange({ ...responses, ethnicity: newEthnicity });
  };

  const handleVeteranStatusChange = (value: string) => {
    onResponsesChange({ ...responses, veteranStatus: value });
  };

  const handleDisabilityStatusChange = (value: string) => {
    onResponsesChange({ ...responses, disabilityStatus: value });
  };

  const handleSelfIdentificationChange = (value: string) => {
    onResponsesChange({ ...responses, selfIdentification: value });
  };

  const ethnicityOptions = [
    { value: 'hispanic-latino', label: 'Hispanic or Latino' },
    { value: 'white', label: 'White' },
    { value: 'black-african-american', label: 'Black or African American' },
    { value: 'native-american', label: 'Native American or Alaska Native' },
    { value: 'asian', label: 'Asian' },
    { value: 'pacific-islander', label: 'Native Hawaiian or Other Pacific Islander' },
    { value: 'two-or-more', label: 'Two or More Races' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Equal Employment Opportunity</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              We are an equal opportunity employer and comply with all applicable federal, state, and local fair employment practices laws.
            </p>
            <p className="font-medium">
              The following information is requested for statistical purposes only and will not affect your application in any way.
            </p>
            <p className="text-xs italic">
              All questions are voluntary. You may select "Prefer not to answer" for any question.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gender Identity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Gender Identity</Label>
            <RadioGroup
              value={responses.gender || ''}
              onValueChange={handleGenderChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" />
                <Label htmlFor="gender-male" className="text-sm">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" />
                <Label htmlFor="gender-female" className="text-sm">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non-binary" id="gender-non-binary" />
                <Label htmlFor="gender-non-binary" className="text-sm">Non-binary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prefer-not-to-answer" id="gender-prefer-not" />
                <Label htmlFor="gender-prefer-not" className="text-sm">Prefer not to answer</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Race/Ethnicity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Race/Ethnicity (Select all that apply)</Label>
            <div className="space-y-2">
              {ethnicityOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ethnicity-${option.value}`}
                    checked={responses.ethnicity?.includes(option.value) || false}
                    onCheckedChange={(checked) => 
                      handleEthnicityChange(option.value, checked as boolean)
                    }
                    disabled={responses.ethnicity?.includes('prefer-not-to-answer') && option.value !== 'prefer-not-to-answer'}
                  />
                  <Label htmlFor={`ethnicity-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ethnicity-prefer-not"
                  checked={responses.ethnicity?.includes('prefer-not-to-answer') || false}
                  onCheckedChange={(checked) => 
                    handleEthnicityChange('prefer-not-to-answer', checked as boolean)
                  }
                />
                <Label htmlFor="ethnicity-prefer-not" className="text-sm">
                  Prefer not to answer
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Veteran Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Are you a protected veteran? 
              <span className="text-xs text-muted-foreground ml-1">
                (Disabled, recently separated, active duty wartime, or Armed Forces service medal veteran)
              </span>
            </Label>
            <RadioGroup
              value={responses.veteranStatus || ''}
              onValueChange={handleVeteranStatusChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="veteran-yes" />
                <Label htmlFor="veteran-yes" className="text-sm">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="veteran-no" />
                <Label htmlFor="veteran-no" className="text-sm">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prefer-not-to-answer" id="veteran-prefer-not" />
                <Label htmlFor="veteran-prefer-not" className="text-sm">Prefer not to answer</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Disability Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Do you have a disability?
              <span className="text-xs text-muted-foreground ml-1 block mt-1">
                A disability is a physical or mental impairment that substantially limits one or more major life activities.
              </span>
            </Label>
            <RadioGroup
              value={responses.disabilityStatus || ''}
              onValueChange={handleDisabilityStatusChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="disability-yes" />
                <Label htmlFor="disability-yes" className="text-sm">Yes, I have a disability</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="disability-no" />
                <Label htmlFor="disability-no" className="text-sm">No, I do not have a disability</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prefer-not-to-answer" id="disability-prefer-not" />
                <Label htmlFor="disability-prefer-not" className="text-sm">Prefer not to answer</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Self-Identification */}
          <div className="space-y-3">
            <Label htmlFor="self-identification" className="text-sm font-medium">
              Additional Self-Identification (Optional)
            </Label>
            <Textarea
              id="self-identification"
              placeholder="If you would like to share any additional information about your identity that you feel is relevant, please do so here..."
              value={responses.selfIdentification || ''}
              onChange={(e) => handleSelfIdentificationChange(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Privacy Notice:</strong> This information is collected for statistical and reporting purposes only. 
              It will be kept confidential and separate from your application materials. Providing this information is 
              completely voluntary and will not affect your consideration for employment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};