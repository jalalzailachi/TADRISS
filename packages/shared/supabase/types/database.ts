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
    };
  };
}
