
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

declare global {
  interface Window {
    supabase: any;
  }
}

export const loadSupabaseSDK = (): Promise<any> => {
  return new Promise((resolve) => {
    if (window.supabase) return resolve(window.supabase);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => resolve(window.supabase);
    document.head.appendChild(script);
  });
};

export const createSupabaseClient = (sdk: any) => {
  return sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};
