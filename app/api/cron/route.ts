
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';   // 強制動態執行（防 static 404）
export const revalidate = 0;               // 防 ISR 快取
export const runtime = 'nodejs';           // 避免 edge runtime 問題

export async function GET() {
  console.log(`[CRON DEBUG] 觸發成功！時間: ${new Date().toISOString()}`);
  console.log('[CRON DEBUG] 環境變數檢查：', {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON ERROR] 缺少環境變數');
    return NextResponse.json({ status: 'error', message: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 為了確保寫入成功，必須符合 DB Schema (ID, Unique URL, Author 等)
  const testId = Date.now();
  const testRow = {
    id: testId, // 必填：因為 DB ID 非自動遞增
    title: `Debug Test ${new Date().toISOString()}`,
    content: '如果這筆出現，表示 cron route 終於通了！',
    contentCN: '如果這筆出現，表示 cron route 終於通了！',
    url: `https://debug-test-${testId}.vercel.app`, // 必填：唯一 URL 避免衝突
    region: 'debug',
    category: '系統',
    author: 'Cron Debugger',
    author_id: 'cron_debug_bot'
  };

  console.log('[CRON DEBUG] 準備寫入資料庫:', testRow);

  const { data, error } = await supabase.from('posts').insert([testRow]).select();

  if (error) {
    console.error('[CRON ERROR] Supabase 寫入失敗:', error);
    return NextResponse.json({ status: 'error', details: error }, { status: 500 });
  }

  console.log('[CRON DEBUG] 寫入成功:', data);
  return NextResponse.json({ status: 'success', message: 'Test insert OK', data });
}
