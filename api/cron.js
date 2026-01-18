
// api/cron.js - Vercel Serverless Function (ES Module)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[CRON] Function started (ESM) at ${timestamp}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[CRON] Env Check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!serviceKey 
    });

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 產生唯一 ID 和 URL 以避免資料庫約束錯誤
    const uniqueId = Date.now();

    const testData = {
      id: uniqueId,
      title: `ES Module Test ${timestamp}`,
      content: '成功！這是用 ES module api/cron.js 寫入的測試資料。',
      contentCN: '成功！這是用 ES module api/cron.js 寫入的測試資料。', // 補全必填欄位
      url: `https://es-module-test-${uniqueId}.com`, // 確保 URL 唯一
      region: '測試',
      category: '系統公告', // 補全必填欄位
      author: 'CronBot',    // 補全必填欄位
      author_id: 'cron_bot_esm', // 補全必填欄位
      created_at: timestamp
    };

    console.log('[CRON] Inserting data:', JSON.stringify(testData));

    const { data, error } = await supabase.from('posts').insert([testData]).select();

    if (error) {
      console.error('[CRON] Supabase Insert Error:', error);
      throw error;
    }

    console.log('[CRON] Success:', data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[CRON] Critical Error:', err.message || err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
