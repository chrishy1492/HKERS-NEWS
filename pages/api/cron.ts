
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 GET 請求，確保由 Cron 觸發
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const timestamp = new Date().toISOString();
  console.log(`[CRON] 觸發成功！時間: ${timestamp}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON] 嚴重錯誤：缺少 Supabase 環境變數');
    return res.status(500).json({ error: 'Missing Supabase environment variables' });
  }

  // 使用 Service Role Key 初始化 Supabase (繞過 RLS)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 準備符合 DB Schema 的測試資料
  // 包含所有必填欄位：id, author, category, contentCN 等
  const testId = Date.now();
  const testData = {
    id: testId,
    title: `Pages Router Cron 測試 - ${new Date().toLocaleTimeString('en-HK')}`,
    content: '成功！這是由 Vercel Cron 透過 Pages Router (pages/api/cron) 寫入的測試資料。',
    contentCN: '成功！這是由 Vercel Cron 透過 Pages Router (pages/api/cron) 寫入的測試資料。',
    url: `https://cron-pages-test-${testId}.vercel.app`, // 確保 URL 唯一
    region: '系統',
    category: '系統公告',
    author: 'Cron System',
    author_id: 'cron_pages_bot',
    source_name: 'Vercel Cron',
    created_at: timestamp
  };

  console.log('[CRON] 準備插入資料：', JSON.stringify(testData));

  const { data, error } = await supabase.from('posts').insert([testData]).select();

  if (error) {
    console.error('[CRON] 插入失敗：', error.message, error.details);
    return res.status(500).json({ error: error.message, details: error });
  }

  console.log('[CRON] 插入成功：', data);
  return res.status(200).json({ success: true, inserted: data });
}
