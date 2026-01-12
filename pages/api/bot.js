import { createClient } from '@supabase/supabase-js';

// Configuration
// 注意：在正式生產環境中，建議將這些密鑰移至 Vercel 的 Environment Variables (process.env)
const SUPABASE_URL = 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG';

export default async function handler(req, res) {
  // 設定 CORS 標頭，允許 cron-job.org 等外部服務觸發
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'GET') {
    try {
      const startTime = new Date();
      console.log(`[HKER Bot] 啟動定時任務: ${startTime.toISOString()}`);

      // 1. 初始化 Supabase 客戶端
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      // 2. 執行資料庫連接測試 (Health Check)
      // 這可以確保 API 路由在執行時能真正連接到您的數據庫
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

      if (error) {
        console.error('[HKER Bot] 資料庫連接失敗:', error);
        throw new Error(`Database Error: ${error.message}`);
      }

      // 3. (可選) 這裡可以擴展您的機械人邏輯
      // 例如：呼叫 GeminiService 生成新聞並寫入 Posts 表
      // 目前我們先保持連接活躍，確保 Cron Job 成功回傳 200

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log(`[HKER Bot] 任務完成。耗時: ${duration}ms`);

      // 4. 回傳成功狀態
      res.status(200).json({ 
        status: 'success', 
        message: 'HKER Bot 任務執行成功 (Task Executed Successfully)',
        timestamp: endTime.toISOString(),
        duration: `${duration}ms`,
        dbStatus: 'Connected'
      });

    } catch (err) {
      console.error('[HKER Bot] 嚴重錯誤:', err);
      res.status(500).json({ 
        status: 'error', 
        message: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ status: 'error', message: `Method ${req.method} Not Allowed` });
  }
}