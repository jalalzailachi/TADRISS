// Placeholder — will be generated via `supabase gen types typescript`
// Run: pnpm db:gen-types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// These types will be auto-generated. For now, define the core shapes manually.
export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          subscription_tier: string;
          max_students: number;
          receipt_sequence: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['institutions']['Row'], 'id' | 'created_at' | 'updated_at' | 'receipt_sequence'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          receipt_sequence?: number;
        };
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          institution_id: string;
          role: 'institution_admin' | 'teacher' | 'student';
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      classes: {
        Row: {
          id: string;
          institution_id: string;
          name: string;
          subject: string | null;
          level: string | null;
          schedule_days: string[] | null;
          schedule_time: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
      };
      attendance_sessions: {
        Row: {
          id: string;
          institution_id: string;
          class_id: string;
          teacher_id: string;
          session_date: string;
          started_at: string;
          completed_at: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['attendance_sessions']['Row'], 'id' | 'started_at'> & {
          id?: string;
          started_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_sessions']['Insert']>;
      };
      attendance_records: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          status: 'present' | 'absent' | 'late';
          marked_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id' | 'marked_at'> & {
          id?: string;
          marked_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          institution_id: string;
          student_id: string;
          amount: number;
          currency: string;
          payment_date: string;
          payment_method: 'cash' | 'transfer' | 'check' | 'other';
          period_label: string | null;
          notes: string | null;
          status: 'recorded' | 'voided';
          recorded_by: string | null;
          voided_at: string | null;
          voided_by: string | null;
          void_reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'status' | 'voided_at' | 'voided_by' | 'void_reason'> & {
          id?: string;
          created_at?: string;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      homework: {
        Row: {
          id: string;
          institution_id: string;
          class_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          file_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['homework']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['homework']['Insert']>;
      };
      class_students: {
        Row: {
          id: string;
          institution_id: string;
          class_id: string;
          student_id: string;
          enrolled_at: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['class_students']['Row'], 'id' | 'enrolled_at'> & {
          id?: string;
          enrolled_at?: string;
        };
        Update: Partial<Database['public']['Tables']['class_students']['Insert']>;
      };
      class_teachers: {
        Row: {
          id: string;
          institution_id: string;
          class_id: string;
          teacher_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['class_teachers']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['class_teachers']['Insert']>;
      };
      enrollment_fees: {
        Row: {
          id: string;
          institution_id: string;
          student_id: string;
          class_id: string | null;
          amount: number;
          period_type: 'monthly' | 'semester' | 'annual' | 'one_time';
          label: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['enrollment_fees']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['enrollment_fees']['Insert']>;
      };
      broadcasts: {
        Row: {
          id: string;
          institution_id: string;
          sender_id: string;
          title: string;
          message: string;
          role_target: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['broadcasts']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['broadcasts']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          institution_id: string;
          sender_id: string;
          subject: string;
          body: string;
          sent_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'sent_at'> & {
          id?: string;
          sent_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      message_recipients: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          is_read: boolean;
          read_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['message_recipients']['Row'], 'id' | 'is_read' | 'read_at'> & {
          id?: string;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['message_recipients']['Insert']>;
      };
    };
  };
}

/** Convenience helpers for referencing generated row/insert/update shapes. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
