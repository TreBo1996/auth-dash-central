
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from './FileUpload';
import { UploadedFiles } from './UploadedFiles';

export const UploadModule: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Document Upload</h1>
        <p className="text-muted-foreground">
          Upload your resumes and job descriptions to get started
        </p>
      </div>

      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="resume">Resume Upload</TabsTrigger>
          <TabsTrigger value="job-description">Job Description</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resume" className="flex justify-center mt-8">
          <FileUpload 
            type="resume" 
            onUploadSuccess={handleUploadSuccess}
          />
        </TabsContent>
        
        <TabsContent value="job-description" className="flex justify-center mt-8">
          <FileUpload 
            type="job-description" 
            onUploadSuccess={handleUploadSuccess}
          />
        </TabsContent>
      </Tabs>

      <UploadedFiles key={refreshTrigger} />
    </div>
  );
};
