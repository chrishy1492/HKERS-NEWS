
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to check if we can actually connect (simple ping)
export const checkSupabaseConnection = async () => {
  try {
    // Attempt a lightweight fetch
    const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase Connection Error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Supabase connection check failed (Network issue?)", e);
    return false;
  }
};
