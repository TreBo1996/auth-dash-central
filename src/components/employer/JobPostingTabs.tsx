import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { JobFormData } from '@/hooks/useJobFormPersistence';

interface BasicInfoTabProps {
  formData: JobFormData;
  updateFormData: (data: Partial<JobFormData>) => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ formData, updateFormData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateFormData({ location: e.target.value })}
              placeholder="e.g., San Francisco, CA"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe the role, company culture, and what makes this opportunity unique..."
            rows={8}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface JobDetailsTabProps {
  formData: JobFormData;
  updateFormData: (data: Partial<JobFormData>) => void;
}

export const JobDetailsTab: React.FC<JobDetailsTabProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(value) => updateFormData({ employment_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select value={formData.experience_level} onValueChange={(value) => updateFormData({ experience_level: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry-level">Entry Level</SelectItem>
                  <SelectItem value="mid-level">Mid Level</SelectItem>
                  <SelectItem value="senior-level">Senior Level</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Remote Type</Label>
              <Select value={formData.remote_type} onValueChange={(value) => updateFormData({ remote_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input
                value={formData.industry}
                onChange={(e) => updateFormData({ industry: e.target.value })}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
            <div className="space-y-2">
              <Label>Job Function</Label>
              <Input
                value={formData.job_function}
                onChange={(e) => updateFormData({ job_function: e.target.value })}
                placeholder="e.g., Engineering, Marketing"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salary Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Minimum Salary</Label>
              <Input
                type="number"
                value={formData.salary_min}
                onChange={(e) => updateFormData({ salary_min: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Salary</Label>
              <Input
                type="number"
                value={formData.salary_max}
                onChange={(e) => updateFormData({ salary_max: e.target.value })}
                placeholder="100000"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.salary_currency} onValueChange={(value) => updateFormData({ salary_currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Input
              type="date"
              value={formData.expires_at}
              onChange={(e) => updateFormData({ expires_at: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface RequirementsBenefitsTabProps {
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  updateRequirements: (requirements: string[]) => void;
  updateResponsibilities: (responsibilities: string[]) => void;
  updateBenefits: (benefits: string[]) => void;
}

export const RequirementsBenefitsTab: React.FC<RequirementsBenefitsTabProps> = ({
  requirements,
  responsibilities,
  benefits,
  updateRequirements,
  updateResponsibilities,
  updateBenefits
}) => {
  const [newRequirement, setNewRequirement] = React.useState('');
  const [newResponsibility, setNewResponsibility] = React.useState('');
  const [newBenefit, setNewBenefit] = React.useState('');

  const addItem = (item: string, current: string[], update: (items: string[]) => void, clear: () => void) => {
    if (item.trim() && !current.includes(item.trim())) {
      update([...current, item.trim()]);
      clear();
    }
  };

  const removeItem = (index: number, current: string[], update: (items: string[]) => void) => {
    update(current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Requirements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Add a requirement..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newRequirement, requirements, updateRequirements, () => setNewRequirement('')))}
            />
            <Button type="button" onClick={() => addItem(newRequirement, requirements, updateRequirements, () => setNewRequirement(''))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {requirements.map((req, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {req}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem(index, requirements, updateRequirements)} />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Responsibilities Section */}
      <Card>
        <CardHeader>
          <CardTitle>Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              placeholder="Add a responsibility..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newResponsibility, responsibilities, updateResponsibilities, () => setNewResponsibility('')))}
            />
            <Button type="button" onClick={() => addItem(newResponsibility, responsibilities, updateResponsibilities, () => setNewResponsibility(''))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {responsibilities.map((resp, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {resp}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem(index, responsibilities, updateResponsibilities)} />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits & Perks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              placeholder="Add a benefit..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newBenefit, benefits, updateBenefits, () => setNewBenefit('')))}
            />
            <Button type="button" onClick={() => addItem(newBenefit, benefits, updateBenefits, () => setNewBenefit(''))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {benefits.map((benefit, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {benefit}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem(index, benefits, updateBenefits)} />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};