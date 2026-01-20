import { createClient } from '@supabase/supabase-js';

// Provided credentials
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to check if we can actually connect (simple ping)
export const checkSupabaseConnection = async () => {
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Supabase connection check failed (Tables might not exist yet), falling back to LocalStorage mode.", e);
    return false;
  }
};