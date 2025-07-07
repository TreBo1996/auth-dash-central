export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cached_jobs: {
        Row: {
          apify_job_id: string | null
          apply_url: string | null
          archived_at: string | null
          company: string
          company_size: string | null
          created_at: string
          data_source: string | null
          description: string | null
          employment_type: string | null
          experience_level: string | null
          first_seen_at: string
          id: string
          industry: string | null
          is_expired: boolean | null
          job_board: string | null
          job_function: string | null
          job_type: string | null
          job_url: string
          last_seen_at: string
          location: string | null
          logo_url: string | null
          posted_at: string | null
          quality_score: number | null
          remote_type: string | null
          salary: string | null
          scraped_at: string | null
          search_vector: unknown | null
          seniority_level: string | null
          source: string
          thumbnail: string | null
          title: string
          updated_at: string
          via: string | null
        }
        Insert: {
          apify_job_id?: string | null
          apply_url?: string | null
          archived_at?: string | null
          company: string
          company_size?: string | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          first_seen_at?: string
          id?: string
          industry?: string | null
          is_expired?: boolean | null
          job_board?: string | null
          job_function?: string | null
          job_type?: string | null
          job_url: string
          last_seen_at?: string
          location?: string | null
          logo_url?: string | null
          posted_at?: string | null
          quality_score?: number | null
          remote_type?: string | null
          salary?: string | null
          scraped_at?: string | null
          search_vector?: unknown | null
          seniority_level?: string | null
          source?: string
          thumbnail?: string | null
          title: string
          updated_at?: string
          via?: string | null
        }
        Update: {
          apify_job_id?: string | null
          apply_url?: string | null
          archived_at?: string | null
          company?: string
          company_size?: string | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          first_seen_at?: string
          id?: string
          industry?: string | null
          is_expired?: boolean | null
          job_board?: string | null
          job_function?: string | null
          job_type?: string | null
          job_url?: string
          last_seen_at?: string
          location?: string | null
          logo_url?: string | null
          posted_at?: string | null
          quality_score?: number | null
          remote_type?: string | null
          salary?: string | null
          scraped_at?: string | null
          search_vector?: unknown | null
          seniority_level?: string | null
          source?: string
          thumbnail?: string | null
          title?: string
          updated_at?: string
          via?: string | null
        }
        Relationships: []
      }
      cover_letters: {
        Row: {
          created_at: string
          generated_text: string
          id: string
          job_description_id: string | null
          job_posting_id: string | null
          optimized_resume_id: string | null
          original_resume_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_text: string
          id?: string
          job_description_id?: string | null
          job_posting_id?: string | null
          optimized_resume_id?: string | null
          original_resume_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_text?: string
          id?: string
          job_description_id?: string | null
          job_posting_id?: string | null
          optimized_resume_id?: string | null
          original_resume_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_optimized_resume_id_fkey"
            columns: ["optimized_resume_id"]
            isOneToOne: false
            referencedRelation: "optimized_resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_original_resume_id_fkey"
            columns: ["original_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          address: string | null
          city: string | null
          company_description: string | null
          company_name: string
          company_size: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          industry: string | null
          logo_url: string | null
          state: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_description?: string | null
          company_name: string
          company_size?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_description?: string | null
          company_name?: string
          company_size?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      interview_responses: {
        Row: {
          audio_file_url: string | null
          clarity_score: number | null
          created_at: string
          examples_score: number | null
          feedback: string
          id: string
          job_relevance_score: number | null
          question_index: number
          question_text: string
          question_type: string
          response_duration_seconds: number | null
          score: number
          session_id: string
          updated_at: string
          user_response_text: string
        }
        Insert: {
          audio_file_url?: string | null
          clarity_score?: number | null
          created_at?: string
          examples_score?: number | null
          feedback: string
          id?: string
          job_relevance_score?: number | null
          question_index: number
          question_text: string
          question_type: string
          response_duration_seconds?: number | null
          score: number
          session_id: string
          updated_at?: string
          user_response_text: string
        }
        Update: {
          audio_file_url?: string | null
          clarity_score?: number | null
          created_at?: string
          examples_score?: number | null
          feedback?: string
          id?: string
          job_relevance_score?: number | null
          question_index?: number
          question_text?: string
          question_type?: string
          response_duration_seconds?: number | null
          score?: number
          session_id?: string
          updated_at?: string
          user_response_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_question_index: number
          id: string
          job_description_id: string
          overall_score: number | null
          session_status: string
          started_at: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          id?: string
          job_description_id: string
          overall_score?: number | null
          session_status?: string
          started_at?: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          id?: string
          job_description_id?: string
          overall_score?: number | null
          session_status?: string
          started_at?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          applied_at: string
          cover_letter: string | null
          id: string
          job_posting_id: string
          notes: string | null
          resume_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_posting_id: string
          notes?: string | null
          resume_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_posting_id?: string
          notes?: string | null
          resume_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          company: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          job_url: string | null
          location: string | null
          parsed_text: string
          salary_range: string | null
          source: string | null
          source_file_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          job_url?: string | null
          location?: string | null
          parsed_text: string
          salary_range?: string | null
          source?: string | null
          source_file_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          job_url?: string | null
          location?: string | null
          parsed_text?: string
          salary_range?: string | null
          source?: string | null
          source_file_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          application_count: number | null
          benefits: string[] | null
          created_at: string
          description: string
          employer_id: string
          employment_type: string | null
          experience_level: string | null
          expires_at: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          job_function: string | null
          location: string | null
          remote_type: string | null
          requirements: string[] | null
          responsibilities: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          seniority_level: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          application_count?: number | null
          benefits?: string[] | null
          created_at?: string
          description: string
          employer_id: string
          employment_type?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          job_function?: string | null
          location?: string | null
          remote_type?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority_level?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          application_count?: number | null
          benefits?: string[] | null
          created_at?: string
          description?: string
          employer_id?: string
          employment_type?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          job_function?: string | null
          location?: string | null
          remote_type?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority_level?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_search_results: {
        Row: {
          cached_job_id: string | null
          created_at: string
          id: string
          job_search_id: string | null
          relevance_score: number | null
        }
        Insert: {
          cached_job_id?: string | null
          created_at?: string
          id?: string
          job_search_id?: string | null
          relevance_score?: number | null
        }
        Update: {
          cached_job_id?: string | null
          created_at?: string
          id?: string
          job_search_id?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_search_results_cached_job_id_fkey"
            columns: ["cached_job_id"]
            isOneToOne: false
            referencedRelation: "cached_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_search_results_job_search_id_fkey"
            columns: ["job_search_id"]
            isOneToOne: false
            referencedRelation: "job_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      job_searches: {
        Row: {
          created_at: string
          date_posted: string | null
          experience_level: string | null
          id: string
          job_type: string | null
          last_updated_at: string
          location: string | null
          search_query: string
          total_results: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_posted?: string | null
          experience_level?: string | null
          id?: string
          job_type?: string | null
          last_updated_at?: string
          location?: string | null
          search_query: string
          total_results?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_posted?: string | null
          experience_level?: string | null
          id?: string
          job_type?: string | null
          last_updated_at?: string
          location?: string | null
          search_query?: string
          total_results?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      optimized_resumes: {
        Row: {
          ats_feedback: Json | null
          ats_score: number | null
          created_at: string
          generated_text: string
          id: string
          job_description_id: string
          original_resume_id: string
          scored_at: string | null
          scoring_criteria: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ats_feedback?: Json | null
          ats_score?: number | null
          created_at?: string
          generated_text: string
          id?: string
          job_description_id: string
          original_resume_id: string
          scored_at?: string | null
          scoring_criteria?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ats_feedback?: Json | null
          ats_score?: number | null
          created_at?: string
          generated_text?: string
          id?: string
          job_description_id?: string
          original_resume_id?: string
          scored_at?: string | null
          scoring_criteria?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimized_resumes_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimized_resumes_original_resume_id_fkey"
            columns: ["original_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          plan_level: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          plan_level?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          plan_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resume_certifications: {
        Row: {
          created_at: string
          display_order: number
          id: string
          issuer: string
          name: string
          optimized_resume_id: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          issuer: string
          name: string
          optimized_resume_id: string
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          issuer?: string
          name?: string
          optimized_resume_id?: string
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_certifications_optimized_resume_id_fkey"
            columns: ["optimized_resume_id"]
            isOneToOne: false
            referencedRelation: "optimized_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_education: {
        Row: {
          created_at: string
          degree: string
          display_order: number
          id: string
          optimized_resume_id: string
          school: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          degree: string
          display_order?: number
          id?: string
          optimized_resume_id: string
          school: string
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          degree?: string
          display_order?: number
          id?: string
          optimized_resume_id?: string
          school?: string
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_education_optimized_resume_id_fkey"
            columns: ["optimized_resume_id"]
            isOneToOne: false
            referencedRelation: "optimized_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_experiences: {
        Row: {
          bullets: string[]
          company: string
          created_at: string
          display_order: number
          duration: string
          id: string
          optimized_resume_id: string
          title: string
          updated_at: string
        }
        Insert: {
          bullets?: string[]
          company: string
          created_at?: string
          display_order?: number
          duration: string
          id?: string
          optimized_resume_id: string
          title: string
          updated_at?: string
        }
        Update: {
          bullets?: string[]
          company?: string
          created_at?: string
          display_order?: number
          duration?: string
          id?: string
          optimized_resume_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_experiences_optimized_resume_id_fkey"
            columns: ["optimized_resume_id"]
            isOneToOne: false
            referencedRelation: "optimized_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_exports: {
        Row: {
          created_at: string
          export_format: string | null
          file_name: string
          file_path: string | null
          id: string
          optimized_resume_id: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          export_format?: string | null
          file_name: string
          file_path?: string | null
          id?: string
          optimized_resume_id: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          export_format?: string | null
          file_name?: string
          file_path?: string | null
          id?: string
          optimized_resume_id?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_exports_optimized_resume_id_fkey"
            columns: ["optimized_resume_id"]
            isOneToOne: false
            referencedRelation: "optimized_resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_exports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          optimized_resume_id: string
          section_type: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          optimized_resume_id: string
          section_type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          optimized_resume_id?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_sections_optimized_resume_id_fkey"
            columns: ["optimized_resume_id"]
            isOneToOne: false
            referencedRelation: "optimized_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_skills: {
        Row: {
          category: string
          created_at: string
          display_order: number
          id: string
          items: string[]
          optimized_resume_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number
          id?: string
          items?: string[]
          optimized_resume_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          items?: string[]
          optimized_resume_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_skills_optimized_resume_id_fkey"
            columns: ["optimized_resume_id"]
            isOneToOne: false
            referencedRelation: "optimized_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          premium_required: boolean | null
          preview_image_url: string | null
          template_config: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          premium_required?: boolean | null
          preview_image_url?: string | null
          template_config: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          premium_required?: boolean | null
          preview_image_url?: string | null
          template_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          original_file_url: string | null
          parsed_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          original_file_url?: string | null
          parsed_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          original_file_url?: string | null
          parsed_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_feature_usage: {
        Row: {
          created_at: string
          feature_type: string
          id: string
          last_reset_date: string
          month_year: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_type: string
          id?: string
          last_reset_date?: string
          month_year: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature_type?: string
          id?: string
          last_reset_date?: string
          month_year?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_role_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_template_preferences: {
        Row: {
          created_at: string
          id: string
          selected_template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          selected_template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          selected_template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_template_preferences_selected_template_id_fkey"
            columns: ["selected_template_id"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_jobs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      can_use_feature: {
        Args: { p_user_id: string; p_feature_type: string }
        Returns: {
          can_use: boolean
          current_usage: number
          limit_reached: boolean
        }[]
      }
      cleanup_old_jobs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_job_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_monthly_usage: {
        Args: { p_user_id: string; p_feature_type: string }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_feature_usage: {
        Args: { p_user_id: string; p_feature_type: string }
        Returns: number
      }
      normalize_search_query: {
        Args: { input_query: string }
        Returns: string
      }
      search_jobs: {
        Args: {
          search_query?: string
          location_filter?: string
          remote_filter?: string
          employment_type_filter?: string
          seniority_filter?: string
          company_filter?: string
          max_age_days?: number
          result_limit?: number
          result_offset?: number
        }
        Returns: {
          id: string
          title: string
          company: string
          location: string
          description: string
          salary: string
          posted_at: string
          job_url: string
          apply_url: string
          source: string
          via: string
          thumbnail: string
          logo_url: string
          job_type: string
          employment_type: string
          experience_level: string
          seniority_level: string
          remote_type: string
          company_size: string
          industry: string
          job_function: string
          scraped_at: string
          quality_score: number
          relevance_score: number
        }[]
      }
    }
    Enums: {
      app_role: "job_seeker" | "employer" | "both"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["job_seeker", "employer", "both"],
    },
  },
} as const
