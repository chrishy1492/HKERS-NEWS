
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const supabaseAnonKey = 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if user is admin
export const isAdmin = (email: string | undefined) => {
  if (!email) return false;
  const adminEmails = ['chrishy1494@gmail.com', 'hkerstoken@gmail.com', 'niceleung@gmail.com'];
  return adminEmails.includes(email.toLowerCase());
};
