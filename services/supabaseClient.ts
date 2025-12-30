
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user for Real-time sync
// Note: In a production environment, these should be in .env files.
// Hardcoded here to ensure functionality in the web preview environment.
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
