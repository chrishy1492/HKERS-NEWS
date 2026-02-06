
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
// WARNING: The fallback key must be a valid ANON KEY. If undefined, Supabase calls will fail.
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 

// If no key is present, create a client that will fail gracefully rather than crashing implicitly
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || 'invalid-key-placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to check if we can actually connect (simple ping)
export const checkSupabaseConnection = async () => {
  if (!SUPABASE_KEY) {
      console.error("Supabase Key is missing! Check your environment variables.");
      return false;
  }
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
