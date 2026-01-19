
import { createClient } from '@supabase/supabase-js';

// Prioritize Environment Variables, fallback to provided defaults if Env is missing (for local/preview)
// Note: The hardcoded key 'sb_publishable...' appeared to be a token ID, not a valid JWT. 
// We strongly recommend setting NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';

// FIX: Provide a non-empty string as fallback to prevent "supabaseKey is required" error
// when environment variables are missing. This allows the app to load in "Offline Mode".
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'missing-key-placeholder'; 

// Initialize Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to check if we can actually connect (simple ping)
export const checkSupabaseConnection = async () => {
  // Explicitly check for the placeholder
  if (SUPABASE_KEY === 'missing-key-placeholder') {
      console.warn("Supabase Key is missing (using placeholder). Running in Offline Mode.");
      return false;
  }
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) {
        console.warn("Supabase Connection Error (Check RLS or Key):", error.message);
        return false;
    }
    return true;
  } catch (e) {
    console.warn("Supabase connection check failed, falling back to LocalStorage mode.", e);
    return false;
  }
};
