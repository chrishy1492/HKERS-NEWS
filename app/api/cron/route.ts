
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Vercel Cron 關鍵設定：強制動態執行，避免被建置為靜態檔案導致 404
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs'; // 使用 Node.js Runtime 以支援完整 Supabase Client

export async function GET() {
  const timestamp = new Date().toISOString();
  console.log(`[CRON DEBUG] 觸發成功！時間: ${timestamp}`);
  
  // 1. 環境變數檢查
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[CRON DEBUG] 環境變數檢查:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey // 必須是 Service Role Key 才能繞過 RLS
  });

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON ERROR] 缺少 Supabase 環境變數');
    return NextResponse.json({ status: 'error', message: 'Missing env vars' }, { status: 500 });
  }

  // 2. 初始化 Supabase (Service Role)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 3. 準備測試資料 - 必須完全符合 dataService.ts 中的 Schema
  // 注意：ID 必須是整數 (BigInt)，不能是 UUID 字串
  const testId = Date.now(); 
  
  const testRow = {
    id: testId,
    title: `Cron 診斷測試 - ${new Date().toLocaleTimeString('en-HK')}`,
    content: '如果這篇文章出現，代表 Vercel Cron 與 Supabase 連線成功！(App Router)',
    contentCN: '如果這篇文章出現，代表 Vercel Cron 與 Supabase 連線成功！(App Router)',
    url: `https://cron-diag-${testId}.vercel.app`, // 確保 URL 唯一避免 Unique Constraint 錯誤
    region: '系統',
    category: '系統公告', // 必須符合 Topic 類型或資料庫約束
    author: 'System Bot',
    author_id: 'cron_sys_001',
    created_at: timestamp
  };

  console.log('[CRON DEBUG] 準備寫入資料庫:', JSON.stringify(testRow));

  // 4. 執行寫入
  const { data, error } = await supabase
    .from('posts')
    .insert([testRow])
    .select();

  if (error) {
    console.error('[CRON ERROR] Supabase 寫入失敗:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database Insert Failed',
      details: error 
    }, { status: 500 });
  }

  console.log('[CRON DEBUG] 寫入成功:', data);
  return NextResponse.json({ 
    status: 'success', 
    message: 'Cron job executed successfully', 
    insertedData: data 
  });
}
