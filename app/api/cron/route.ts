
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';  // 強制每次執行，不被快取
export const runtime = 'nodejs';         // 確保用 Node.js runtime，避免 edge 問題

export async function GET() {
  console.log(`[CRON] 機器人觸發！時間: ${new Date().toISOString()}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON] 缺少環境變數！');
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const testId = Date.now(); // 產生唯一 ID 避免 BigInt 衝突
  const testInsert = {
    id: testId,
    title: `Cron 自動測試 - ${new Date().toISOString()}`,
    content: '成功寫入！這是由 Vercel cron + service_role key 插入的測試文章。',
    contentCN: '成功寫入！這是由 Vercel cron + service_role key 插入的測試文章。', // 補齊常用欄位
    url: `https://test-cron-success-${testId}.example.com`, // 確保 URL 唯一
    region: '測試',
    category: '系統',       // 補齊必填欄位
    author: 'Cron System',  // 補齊必填欄位
    author_id: 'cron_bot_test',
    created_at: new Date().toISOString()
  };

  console.log('[CRON] 準備插入資料：', testInsert);

  const { data, error } = await supabase
    .from('posts')
    .insert([testInsert]) // 傳入陣列比較保險
    .select();

  if (error) {
    console.error('[CRON] 插入失敗！錯誤：', error.message, error.code, error.details);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  console.log('[CRON] 插入成功！資料：', data);
  return NextResponse.json({ success: true, inserted: data });
}
