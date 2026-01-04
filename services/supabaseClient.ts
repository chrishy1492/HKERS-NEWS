
import { createClient } from '@supabase/supabase-js';

// Credentials provided for the HKER Platform
// NOTE: We use the Publishable (Anon) Key for frontend security. 
// The Secret Key should NEVER be exposed in client-side code.
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  }
});
