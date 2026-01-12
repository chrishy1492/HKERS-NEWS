import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export default async function handler(req, res) {
  // Config: Prevent caching and allow external cron services
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const startTime = new Date();
    // 1. Init Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 2. DB Connection Check (Heartbeat)
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Database Connection Error: ${error.message}`);
    }

    // 3. (Optional) You can add logic here to trigger Gemini generation via API
    // However, for the cron job 200 OK signal, checking the DB is sufficient proof of life.

    const duration = Date.now() - startTime.getTime();

    // 4. Response
    return res.status(200).json({ 
      status: 'success', 
      message: 'HKER Bot Online',
      timestamp: startTime.toISOString(),
      duration: `${duration}ms`,
      dbStatus: 'Connected',
      note: 'Function location: /api/bot.js'
    });

  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}