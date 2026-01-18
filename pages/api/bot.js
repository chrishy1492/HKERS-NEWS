
import { createClient } from '@supabase/supabase-js';

/**
 * 機器人連線診斷模式
 * 用途：測試 Vercel Serverless Function 是否有權限寫入 Supabase
 */
export default async function handler(req, res) {
  // 1. 防止緩存
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  console.log("=== 機器人強制測試模式觸發！時間：", new Date().toISOString(), "===");

  // 2. 檢查關鍵變數
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ 嚴重錯誤：缺少 SUPABASE_SERVICE_ROLE_KEY 環境變數");
      return res.status(500).json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  // 3. 初始化 Supabase (使用最高權限 Service Role Key)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 4. 準備測試資料 (配合現有 Schema)
  const testId = Date.now();
  const testData = {
    id: testId, // 必須提供 ID
    title: "【系統診斷】機器人連線測試 - " + new Date().toLocaleTimeString(),
    content: "如果您在首頁看到這篇文章，代表 Vercel 與 Supabase 的寫入連線完全正常！",
    contentCN: "如果您在首頁看到這篇文章，代表 Vercel 與 Supabase 的寫入連線完全正常！下一步請還原 bot.js 代碼。",
    url: `https://test-connection-${testId}.example.com`, // 確保 URL 唯一避免衝突
    region: "全部",
    category: "時事",
    author_id: 'system_diag',
    author: "系統機器人",
    source_name: "連線測試",
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
        error: error.message, 
        details: error,
        hint: "請檢查 Supabase RLS Policy 或欄位格式" 
    });
  }

  console.log("✅ 寫入成功！", data);
  
  return res.status(200).json({ 
      success: true, 
      message: "測試文章已發布", 
      data 
  });
}
