import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types based on your schema
export interface Project {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface Team {
  id: number;
  name: string;
  assignee: string; // domain of PO of that team
  type: number; // 0: sheet, 1: jira
}

export interface TeamProject {
  teamId: number;
  projectId: number;
  description: string;
}

export interface Task {
  taskId: number;
  teamId: number;
  projectId: number;
  url: string;
}

export interface Comment {
  id: number;
  projectId: number;
  comment: string;
  user: string;
  created_at: string;
}
