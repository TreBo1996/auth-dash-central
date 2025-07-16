import { useState, useEffect } from 'react';

interface JobDescriptionFormData {
  jobTitle: string;
  companyName: string;
  textInput: string;
  activeTab: string;
}

const STORAGE_KEY = 'job_description_upload_draft';

export const useJobDescriptionPersistence = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: JobDescriptionFormData = JSON.parse(savedData);
        setJobTitle(parsed.jobTitle || '');
        setCompanyName(parsed.companyName || '');
        setTextInput(parsed.textInput || '');
        setActiveTab(parsed.activeTab || 'file');
        setIsDraftRestored(true);
        
        // Clear the restoration flag after a short delay
        setTimeout(() => setIsDraftRestored(false), 3000);
      } catch (error) {
        console.error('Error loading saved job description draft:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  const saveToStorage = (data: Partial<JobDescriptionFormData>) => {
    const currentData = localStorage.getItem(STORAGE_KEY);
    let existingData: JobDescriptionFormData = {
      jobTitle: '',
      companyName: '',
      textInput: '',
      activeTab: 'file'
    };

    if (currentData) {
      try {
        existingData = JSON.parse(currentData);
      } catch (error) {
        console.error('Error parsing existing data:', error);
      }
    }

    const updatedData = { ...existingData, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  };

  const updateJobTitle = (newJobTitle: string) => {
    setJobTitle(newJobTitle);
    saveToStorage({ jobTitle: newJobTitle });
  };

  const updateCompanyName = (newCompanyName: string) => {
    setCompanyName(newCompanyName);
    saveToStorage({ companyName: newCompanyName });
  };

  const updateTextInput = (newTextInput: string) => {
    setTextInput(newTextInput);
    saveToStorage({ textInput: newTextInput });
  };

  const updateActiveTab = (newActiveTab: string) => {
    setActiveTab(newActiveTab);
    saveToStorage({ activeTab: newActiveTab });
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setJobTitle('');
    setCompanyName('');
    setTextInput('');
    setActiveTab('file');
    setIsDraftRestored(false);
  };

  const resetForm = () => {
    setJobTitle('');
    setCompanyName('');
    setTextInput('');
    setActiveTab('file');
  };

  return {
    jobTitle,
    companyName,
    textInput,
    activeTab,
    isDraftRestored,
    updateJobTitle,
    updateCompanyName,
    updateTextInput,
    updateActiveTab,
    clearDraft,
    resetForm
  };
};