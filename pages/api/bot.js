
import { createClient } from '@supabase/supabase-js';

/**
 * 機器人連線診斷模式 (Step A)
 * 用途：測試 Vercel Serverless Function 是否有權限寫入 Supabase (繞過 RLS)
 */
export default async function handler(req, res) {
  // 1. 防止 Vercel 緩存響應，確保每次都執行
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  console.log("=== [DIAGNOSTIC] 機器人強制測試模式觸發！時間：", new Date().toISOString(), "===");

  // 2. 檢查關鍵環境變數 (這是最常見的錯誤點)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ 嚴重錯誤：缺少 SUPABASE_SERVICE_ROLE_KEY 或 URL 環境變數");
      return res.status(500).json({ 
          error: "Missing Environment Variables", 
          hint: "請檢查 Vercel Settings > Environment Variables 是否有 SUPABASE_SERVICE_ROLE_KEY" 
      });
  }

  // 3. 初始化 Supabase (使用最高權限 Service Role Key，自動繞過 RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
  });

  // 4. 準備測試資料 (配合現有 Schema，確保欄位對應正確)
  const testId = Date.now(); // 使用時間戳作為 ID，避免重複
  const testData = {
    id: testId, 
    title: `【系統診斷】連線測試成功 - ${new Date().toLocaleTimeString('en-HK')}`,
    content: "如果您在首頁看到這篇文章，代表 Vercel 與 Supabase 的後端寫入連線完全正常！Service Role Key 權限有效。",
    contentCN: "如果您在首頁看到這篇文章，代表 Vercel 與 Supabase 的後端寫入連線完全正常！Service Role Key 權限有效。",
    url: `https://test-connection-${testId}.example.com`, // 確保 URL 唯一
    region: "全部",
    category: "時事",
    author_id: 'system_diag_bot',
    author: "系統測試員", // 對應 DB 中的 author 欄位
    source_name: "System Check",
    created_at: new Date().toISOString()
  };

  console.log("準備寫入資料庫...", JSON.stringify(testData, null, 2));

  // 5. 執行寫入
  const { data, error } = await supabase
    .from("posts")
    .insert([testData])
    .select();

  if (error) {
    console.error("❌ 寫入失敗！錯誤詳情：", error);
    return res.status(500).json({ 
        success: false, 
        message: "資料庫寫入失敗",
        error: error.message, 
        code: error.code,
        details: error
    });
  }

  console.log("✅ 寫入成功！", data);
  
  return res.status(200).json({ 
      success: true, 
      message: "測試文章已成功發布至資料庫", 
      data: data
  });
}
