import { createClient } from '@supabase/supabase-js';

// Supabase URL and Key should be set in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost:3000';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key-for-development';

// 개발 환경에서만 환경 변수 체크 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment Variables Check:');
  console.log('📍 Environment:', process.env.NODE_ENV);
  console.log('🌐 Supabase URL:', supabaseUrl.substring(0, 30) + '...');
  console.log('🔑 Supabase Key:', supabaseAnonKey.substring(0, 20) + '...');
  console.log('🔐 Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...' || 'Not set');
  console.log('🤖 Google API Key:', process.env.GOOGLE_API_KEY?.substring(0, 20) + '...' || 'Not set');
}

// Check if we have valid Supabase configuration
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: any;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          description: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          description?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          description?: string | null;
          user_id?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          description: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          description?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          description?: string | null;
          user_id?: string;
          updated_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          url: string;
          title: string;
          description: string | null;
          category: string;
          tags: string[];
          memo: string | null;
          is_read: boolean;
          read_at: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          title: string;
          description?: string | null;
          category: string;
          tags?: string[];
          memo?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          title?: string;
          description?: string | null;
          category?: string;
          tags?: string[];
          memo?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          user_id?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Create Supabase client with fallback values and custom options
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // Enable automatic token refresh
    persistSession: true,    // Persist session in storage
    detectSessionInUrl: true // Enable detection of session from URL
  }
}); 