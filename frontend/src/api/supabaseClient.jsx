import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://svdwcionemyzyptdzymj.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHdjaW9uZW15enlwdGR6eW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMjIyMTQsImV4cCI6MjA5Njg5ODIxNH0.YOKW8sF_v1mCiPyGpaueM-guDRqy4yo6TyBsg-OrdcQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
