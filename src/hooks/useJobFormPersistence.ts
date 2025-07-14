import { useState, useEffect } from 'react';

export interface JobFormData {
  title: string;
  description: string;
  location: string;
  remote_type: string;
  employment_type: string;
  experience_level: string;
  seniority_level: string;
  job_function: string;
  industry: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  expires_at: string;
}

const STORAGE_KEY = 'job_form_draft';

export const useJobFormPersistence = (jobId?: string) => {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    location: '',
    remote_type: '',
    employment_type: '',
    experience_level: '',
    seniority_level: '',
    job_function: '',
    industry: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    expires_at: ''
  });

  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);

  // Load saved data on mount
  useEffect(() => {
    if (!jobId) { // Only load from storage for new jobs
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData || formData);
          setRequirements(parsed.requirements || []);
          setResponsibilities(parsed.responsibilities || []);
          setBenefits(parsed.benefits || []);
        } catch (error) {
          console.error('Failed to parse saved form data:', error);
        }
      }
    }
  }, [jobId]);

  // Auto-save to localStorage
  const saveToStorage = (data: any) => {
    if (!jobId) { // Only save drafts for new jobs
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  };

  const updateFormData = (newData: Partial<JobFormData>) => {
    const updated = { ...formData, ...newData };
    setFormData(updated);
    saveToStorage({ formData: updated, requirements, responsibilities, benefits });
  };

  const updateRequirements = (newRequirements: string[]) => {
    setRequirements(newRequirements);
    saveToStorage({ formData, requirements: newRequirements, responsibilities, benefits });
  };

  const updateResponsibilities = (newResponsibilities: string[]) => {
    setResponsibilities(newResponsibilities);
    saveToStorage({ formData, requirements, responsibilities: newResponsibilities, benefits });
  };

  const updateBenefits = (newBenefits: string[]) => {
    setBenefits(newBenefits);
    saveToStorage({ formData, requirements, responsibilities, benefits: newBenefits });
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const loadJobData = (jobData: any) => {
    setFormData({
      title: jobData.title || '',
      description: jobData.description || '',
      location: jobData.location || '',
      remote_type: jobData.remote_type || '',
      employment_type: jobData.employment_type || '',
      experience_level: jobData.experience_level || '',
      seniority_level: jobData.seniority_level || '',
      job_function: jobData.job_function || '',
      industry: jobData.industry || '',
      salary_min: jobData.salary_min?.toString() || '',
      salary_max: jobData.salary_max?.toString() || '',
      salary_currency: jobData.salary_currency || 'USD',
      expires_at: jobData.expires_at ? new Date(jobData.expires_at).toISOString().split('T')[0] : ''
    });

    setRequirements(jobData.requirements || []);
    setResponsibilities(jobData.responsibilities || []);
    setBenefits(jobData.benefits || []);
  };

  return {
    formData,
    requirements,
    responsibilities,
    benefits,
    updateFormData,
    updateRequirements,
    updateResponsibilities,
    updateBenefits,
    clearDraft,
    loadJobData,
    setFormData,
    setRequirements,
    setResponsibilities,
    setBenefits
  };
};