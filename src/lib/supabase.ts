import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zftfilbpeltkbbuzxwus.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmdGZpbGJwZWx0a2JidXp4d3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2Mjg1MzgsImV4cCI6MjA2NzIwNDUzOH0.kx0GoSoFOlkTWDXsXWnZyYD62nr-xZea3RQS_N3ZD8M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// טיפוסים לנתונים - ezcontrol
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  totalHours: number;
  totalMinutes?: number;
  totalSessions?: number;
  lastWorkDate?: string;
  status?: string;
  notes?: string;
  sessions: Array<{ date: string; hours: number; description: string; }>;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  client_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  hours: number;
  minutes?: number;
  description: string;
  project_name?: string;
  task_type?: string;
  status?: string;
  rate_per_hour?: number;
  total_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  total_hours?: number;
  budget?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SystemSettings {
  id: string;
  company_name: string;
  company_slogan: string;
  default_rate_per_hour: number;
  currency: string;
  timezone: string;
  language: string;
  theme: string;
  backup_frequency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Backup {
  id: string;
  backup_type: string;
  data: any;
  file_name?: string;
  file_size?: number;
  status?: string;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  user_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
} 