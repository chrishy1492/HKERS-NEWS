
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 強制動態執行，防止 Vercel 緩存 Cron 請求
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log(`[CRON START] ${new Date().toISOString()} - 機器人開始工作 (App Router)`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[CRON ERROR] 缺少 Supabase 環境變數！');
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  // 使用 Service Role Key 初始化，擁有最高權限繞過 RLS
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const testId = Date.now();
  // 構建符合資料庫 Schema 的測試資料
  const testData = {
    id: testId,
    title: `Cron 自動測試 (App Router) - ${new Date().toLocaleTimeString('en-HK')}`,
    content: '成功！這是由 Vercel cron 透過 service_role key 寫入的測試資料。RLS 已關，應該直接進去。',
    contentCN: '成功！這是由 Vercel cron 透過 service_role key 寫入的測試資料。RLS 已關，應該直接進去。',
    url: `https://cron-test-${testId}.example.com`,
    region: '測試',
    category: '系統',
    author: 'Cron Bot',
    author_id: 'cron_system_test',
    source_name: 'Vercel Cron',
    created_at: new Date().toISOString()
  };

  console.log('[CRON] 嘗試插入：', testData);

  const { data, error } = await supabase
    .from('posts')
    .insert([testData])
    .select();

  if (error) {
    console.error('[CRON ERROR] Supabase 插入失敗：', error.message, error.code, error.details);
    return NextResponse.json({ 
        success: false,
        error: error.message, 
        details: error 
    }, { status: 500 });
  }

  console.log('[CRON SUCCESS] 插入完成：', data);
  return NextResponse.json({ success: true, inserted: data });
}
