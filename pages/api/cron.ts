
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. 只允許 GET 請求 (Vercel Cron 預設使用 GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const timestamp = new Date().toISOString();
  console.log(`[CRON] 機器人觸發成功！時間: ${timestamp}`);

  // 2. 檢查環境變數
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON] 嚴重錯誤：缺少 Supabase 環境變數！');
    return res.status(500).json({ error: 'Missing env vars' });
  }

  // 3. 初始化 Supabase (使用 Service Role Key 繞過 RLS)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 4. 準備測試資料
  // 注意：我們必須符合 posts 資料表的 Schema (id 為 bigint, 必填欄位等)
  const testId = Date.now();
  const testData = {
    id: testId,
    title: `Cron 測試 (Pages Router) - ${new Date().toLocaleTimeString('en-HK')}`,
    content: '成功寫入！這證明 Pages Router 的 /api/cron 已經通了，insert 正常執行。',
    contentCN: '成功寫入！這證明 Pages Router 的 /api/cron 已經通了，insert 正常執行。',
    url: `https://pages-cron-test-${testId}.example.com`, // 確保 URL 唯一避免衝突
    region: '系統',
    category: '系統公告',
    author: 'Cron Bot',
    author_id: 'cron_sys_pages',
    created_at: timestamp
  };

  console.log('[CRON] 準備插入這筆測試資料：', JSON.stringify(testData));

  // 5. 執行寫入
  const { data, error } = await supabase
    .from('posts')
    .insert([testData])
    .select();

  if (error) {
    console.error('[CRON] Supabase 插入失敗：', error.message, error.details);
    return res.status(500).json({ error: error.message, details: error });
  }

  console.log('[CRON] 插入成功！', data);
  return res.status(200).json({ success: true, inserted: data });
}
