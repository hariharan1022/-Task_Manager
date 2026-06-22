export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          college: string | null
          course: string | null
          created_at: string
          domain: string
          email: string
          full_name: string
          id: string
          intern_id: string
          offer_issued_at: string
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
          year: string | null
        }
        Insert: {
          college?: string | null
          course?: string | null
          created_at?: string
          domain: string
          email: string
          full_name: string
          id?: string
          intern_id: string
          offer_issued_at?: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          user_id: string
          year?: string | null
        }
        Update: {
          college?: string | null
          course?: string | null
          created_at?: string
          domain?: string
          email?: string
          full_name?: string
          id?: string
          intern_id?: string
          offer_issued_at?: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          application_id: string
          certificate_id: string
          id: string
          issued_at: string
          verification_hash: string
        }
        Insert: {
          application_id: string
          certificate_id: string
          id?: string
          issued_at?: string
          verification_hash: string
        }
        Update: {
          application_id?: string
          certificate_id?: string
          id?: string
          issued_at?: string
          verification_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          certificate_id: string
          enrollment_id: string
          id: string
          issued_at: string
          score: number
          verification_hash: string
        }
        Insert: {
          certificate_id: string
          enrollment_id: string
          id?: string
          issued_at?: string
          score: number
          verification_hash: string
        }
        Update: {
          certificate_id?: string
          enrollment_id?: string
          id?: string
          issued_at?: string
          score?: number
          verification_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quiz_questions: {
        Row: {
          correct_index: number
          course_id: string
          created_at: string
          explanation: string | null
          id: string
          marks: number
          options: Json
          order_index: number
          question: string
          question_type: string
        }
        Insert: {
          correct_index: number
          course_id: string
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          options: Json
          order_index: number
          question: string
          question_type?: string
        }
        Update: {
          correct_index?: number
          course_id?: string
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          options?: Json
          order_index?: number
          question?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quiz_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_task_submissions: {
        Row: {
          enrollment_id: string
          feedback: string | null
          file_path: string | null
          id: string
          notes: string | null
          project_url: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          task_id: string
        }
        Insert: {
          enrollment_id: string
          feedback?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          project_url?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          task_id: string
        }
        Update: {
          enrollment_id?: string
          feedback?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          project_url?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_task_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "course_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tasks: {
        Row: {
          course_id: string
          created_at: string
          description: string
          due_days: number
          id: string
          requirements: string
          task_number: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description: string
          due_days?: number
          id?: string
          requirements?: string
          task_number: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          due_days?: number
          id?: string
          requirements?: string
          task_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tasks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_topics: {
        Row: {
          code_example: string | null
          content_md: string
          course_id: string
          created_at: string
          id: string
          key_points: string[]
          order_index: number
          title: string
        }
        Insert: {
          code_example?: string | null
          content_md?: string
          course_id: string
          created_at?: string
          id?: string
          key_points?: string[]
          order_index: number
          title: string
        }
        Update: {
          code_example?: string | null
          content_md?: string
          course_id?: string
          created_at?: string
          id?: string
          key_points?: string[]
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          difficulty: string
          domain: string
          duration_weeks: number
          icon: string
          id: string
          is_published: boolean
          name: string
          pass_marks: number
          quiz_duration_min: number
          quiz_marks: number
          short_description: string
          slug: string
          total_tasks: number
          total_topics: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          domain: string
          duration_weeks?: number
          icon?: string
          id?: string
          is_published?: boolean
          name: string
          pass_marks?: number
          quiz_duration_min?: number
          quiz_marks?: number
          short_description: string
          slug: string
          total_tasks?: number
          total_topics?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          domain?: string
          duration_weeks?: number
          icon?: string
          id?: string
          is_published?: boolean
          name?: string
          pass_marks?: number
          quiz_duration_min?: number
          quiz_marks?: number
          short_description?: string
          slug?: string
          total_tasks?: number
          total_topics?: number
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          current_topic_id: string | null
          id: string
          progress_percent: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          current_topic_id?: string | null
          id?: string
          progress_percent?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          current_topic_id?: string | null
          id?: string
          progress_percent?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_current_topic_id_fkey"
            columns: ["current_topic_id"]
            isOneToOne: false
            referencedRelation: "course_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          enrollment_id: string
          id: string
          topic_id: string
        }
        Insert: {
          completed_at?: string
          enrollment_id: string
          id?: string
          topic_id: string
        }
        Update: {
          completed_at?: string
          enrollment_id?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "course_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string
          id: string
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at: string
          utr_number: string
          verified_at: string | null
        }
        Insert: {
          amount?: number
          application_id: string
          id?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string
          utr_number: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          application_id?: string
          id?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string
          utr_number?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          college: string | null
          course: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          photo_url: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          college?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          college?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          enrollment_id: string
          id: string
          passed: boolean
          score: number
          started_at: string
          submitted_at: string | null
          total: number
        }
        Insert: {
          answers?: Json
          enrollment_id: string
          id?: string
          passed?: boolean
          score?: number
          started_at?: string
          submitted_at?: string | null
          total?: number
        }
        Update: {
          answers?: Json
          enrollment_id?: string
          id?: string
          passed?: boolean
          score?: number
          started_at?: string
          submitted_at?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          application_id: string
          deployed_url: string | null
          feedback: string | null
          github_url: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          task_id: string
        }
        Insert: {
          application_id: string
          deployed_url?: string | null
          feedback?: string | null
          github_url?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          task_id: string
        }
        Update: {
          application_id?: string
          deployed_url?: string | null
          feedback?: string | null
          github_url?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          description: string
          domain: string
          id: string
          resources: string | null
          task_number: number
          title: string
        }
        Insert: {
          description: string
          domain: string
          id?: string
          resources?: string | null
          task_number: number
          title: string
        }
        Update: {
          description?: string
          domain?: string
          id?: string
          resources?: string | null
          task_number?: number
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      application_status: "pending" | "approved"
      payment_status: "pending" | "verified" | "rejected"
      submission_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      application_status: ["pending", "approved"],
      payment_status: ["pending", "verified", "rejected"],
      submission_status: ["pending", "approved", "rejected"],
    },
  },
} as const
