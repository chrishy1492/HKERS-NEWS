
// api/cron.js
// Vercel Serverless Function
// 這不依賴 Next.js，直接由 Vercel 基礎設施執行
// 用途：解決 Cron Job 404 問題

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Vercel Cron 預設發送 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const timestamp = new Date().toISOString();
  console.log(`[CRON] Vercel Native Function Started at ${timestamp}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON] Error: Missing Environment Variables');
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 使用時間戳作為唯一 ID，避免 Primary Key 衝突
  const uniqueId = Date.now();

  const testData = {
    id: uniqueId,
    title: `Vercel Native Cron Test ${timestamp}`,
    content: '成功！這是用根目錄 api/cron.js (Serverless Function) 寫入的測試資料。此路徑繞過了 Vite 前端路由。',
    contentCN: '成功！這是用根目錄 api/cron.js (Serverless Function) 寫入的測試資料。此路徑繞過了 Vite 前端路由。',
    url: `https://vercel-native-cron-${uniqueId}.example.com`,
    region: '測試',
    category: '系統公告',
    author: 'VercelBot',
    author_id: 'vercel_cron_native',
    created_at: timestamp
  };

  console.log('[CRON] Attempting insert:', JSON.stringify(testData));

  const { data, error } = await supabase.from('posts').insert([testData]).select();

  if (error) {
    console.error('[CRON] Insert failed:', error.message);
    return res.status(500).json({ error: error.message, details: error });
  }

  console.log('[CRON] Insert Success:', data);
  return res.status(200).json({ success: true, message: 'Test insert OK', data });
};
