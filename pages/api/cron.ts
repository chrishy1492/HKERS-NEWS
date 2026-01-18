
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. 嚴格限制為 GET 方法 (Cron Job 標準)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log(`[CRON] 觸發！時間: ${new Date().toISOString()}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON] 缺少環境變數 (Missing Env Vars)');
    return res.status(500).json({ error: 'Missing env vars' });
  }

  // 初始化 Supabase (Service Role)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
  });

  // 2. 準備測試資料
  // 注意：補全了 author_id, category, contentCN 等可能必填的欄位，防止 DB 報錯
  const timestamp = Date.now();
  const testData = {
    id: timestamp, // 確保 ID 唯一且為數字
    title: `測試文章 (Pages Router) - ${new Date().toISOString()}`,
    content: '成功！這是由 Vercel cron 透過 Pages Router 寫入的測試資料。',
    contentCN: '成功！這是由 Vercel cron 透過 Pages Router 寫入的測試資料。',
    url: `https://test-pages-router-${timestamp}.vercel.app`, // 確保 URL 唯一避免 Unique Constraint Error
    region: '測試',
    category: '系統公告',
    author: 'CronBot',
    author_id: 'cron_bot_system',
    created_at: new Date().toISOString()
  };

  console.log('[CRON] 準備插入資料：', JSON.stringify(testData));

  // 3. 執行寫入
  const { data, error } = await supabase.from('posts').insert([testData]).select();

  if (error) {
    console.error('[CRON] 資料庫錯誤：', error.message);
    return res.status(500).json({ error: error.message, details: error });
  }

  console.log('[CRON] 寫入成功：', data);
  return res.status(200).json({ success: true, data });
}
