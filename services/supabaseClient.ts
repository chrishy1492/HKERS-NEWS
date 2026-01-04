
import { createClient } from '@supabase/supabase-js';

// Credentials provided for the HKER Platform
// REAL-TIME SYNC ENABLED
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  // Global request options to ensure data freshness
  global: {
    headers: { 'x-application-name': 'hker-platform-v2' },
  },
});
