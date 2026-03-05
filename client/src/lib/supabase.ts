import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) not set; auth and My Analyses will be disabled.");
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type ReportRow = {
  id: string;
  user_id: string;
  product_name: string;
  analysis_data: Record<string, unknown>;
  created_at: string;
};
