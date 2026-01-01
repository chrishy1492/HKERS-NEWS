
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Initialize Supabase Client
// Note: In a real production environment, ensure your Supabase project 
// has the corresponding tables (profiles, posts, visitor_logs) created.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
