export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      job_descriptions: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          parsed_text: string
          source_file_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          parsed_text: string
          source_file_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          parsed_text?: string
          source_file_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      optimized_resumes: {
        Row: {
          created_at: string
          generated_text: string
          id: string
          job_description_id: string
          original_resume_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_text: string
          id?: string
          job_description_id: string
          original_resume_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_text?: string
          id?: string
          job_description_id?: string
          original_resume_id?: string
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
          plan_level: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan_level?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
