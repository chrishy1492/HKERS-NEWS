
// api/cron.js
// Vercel Serverless Function (Native)
// 這是直接部署在 Vercel 基礎設施上的函數，不經過 Next.js 路由層

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // 只允許 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const timestamp = new Date().toISOString();
  console.log(`[CRON] Vercel Native Function Triggered at ${timestamp}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON] Missing Environment Variables');
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 產生唯一 ID (使用時間戳避免 BigInt 衝突)
  const uniqueId = Date.now();

  const testData = {
    id: uniqueId,
    title: `Vercel Native Function Test - ${new Date().toLocaleTimeString('en-HK')}`,
    content: '成功！這是用 Vercel 原生 root/api/cron.js 寫入的測試資料。',
    contentCN: '成功！這是用 Vercel 原生 root/api/cron.js 寫入的測試資料。',
    url: `https://vercel-native-test-${uniqueId}.example.com`,
    region: '測試',
    category: '系統公告',
    author: 'VercelBot',
    author_id: 'vercel_native_cron',
    created_at: timestamp
  };

  console.log('[CRON] Inserting data:', JSON.stringify(testData));

  const { data, error } = await supabase.from('posts').insert([testData]).select();

  if (error) {
    console.error('[CRON] Insert Error:', error.message);
    return res.status(500).json({ error: error.message, details: error });
  }

  console.log('[CRON] Success:', data);
  return res.status(200).json({ success: true, message: 'Insert OK', data });
};
