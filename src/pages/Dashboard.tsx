import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Edit, Trash2, Sparkles, Palette, ChevronDown, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { ResumeOptimizer } from '@/components/ResumeOptimizer';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { ContentPreview } from '@/components/ContentPreview';
import { useNavigate } from 'react-router-dom';

interface Resume {
  id: string;
  original_file_url: string | null;
  parsed_text: string | null;
  file_name: string | null;
  created_at: string;
}

interface JobDescription {
  id: string;
  title: string;
  source_file_url: string | null;
  parsed_text: string;
  file_name: string | null;
  created_at: string;
}

interface ATSFeedback {
  overall_score: number;
  category_scores: {
    keyword_match: number;
    skills_alignment: number;
    experience_relevance: number;
    format_compliance: number;
  };
  recommendations: string[];
  keyword_analysis: {
    matched_keywords: string[];
    missing_keywords: string[];
  };
  strengths: string[];
  areas_for_improvement: string[];
}

interface OptimizedResume {
  id: string;
  original_resume_id: string;
  job_description_id: string;
  generated_text: string;
  created_at: string;
  ats_score?: number;
  ats_feedback?: ATSFeedback;
  resumes?: {
    file_name: string | null;
  };
  job_descriptions?: {
    title: string;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [optimizedResumes, setOptimizedResumes] = useState<OptimizedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumesOpen, setResumesOpen] = useState(true);
  const [jobDescriptionsOpen, setJobDescriptionsOpen] = useState(true);
  const [optimizedResumesOpen, setOptimizedResumesOpen] = useState(true);
  const [previewContent, setPreviewContent] = useState<{
    content: string;
    title: string;
    type: 'resume' | 'job-description';
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
    fetchResumes();
    fetchJobDescriptions();
    fetchOptimizedResumes();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: "Error",
        description: "Failed to load resumes.",
        variant: "destructive"
      });
    }
  };

  const fetchJobDescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobDescriptions(data || []);
    }
