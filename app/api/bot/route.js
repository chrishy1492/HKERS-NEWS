
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase
// 注意：請確保環境變數已正確設定
const supabase = createClient(
  process.env.SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  console.log('=== [BOT] 開始執行任務 ===', new Date().toISOString());

  try {
    // 嚴格過濾 36 小時內的新聞 (API 參數使用日期)
    const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    // 擴大查詢範圍，涵蓋所有指定地區與主題
    // Mapped regions to codes used by frontend (us, hk, au, eu, tw, uk, ca)
    const queryConfigs = [
      { q: 'CES 2026 OR Nvidia Rubin OR Intel Core Ultra', region: 'us', topic: 'digital' },
      { q: 'Hong Kong property OR real estate OR luxury flat', region: 'hk', topic: 'property' },
      { q: 'Australia heatwave OR bushfire OR Australia weather', region: 'au', topic: 'weather' },
      { q: 'Europe cold snap OR snow storm OR Europe weather', region: 'eu', topic: 'weather' },
      { q: 'Taiwan news OR China military OR Taiwan Strait', region: 'tw', topic: 'news' },
      { q: 'UK economy OR FTSE OR London news', region: 'uk', topic: 'finance' },
      { q: 'Canada minimum wage OR Canada economy OR Trudeau', region: 'ca', topic: 'finance' },
      { q: 'World travel deals OR new airline routes', region: 'hk', topic: 'travel' },
      { q: 'New car launch OR EV market 2026', region: 'us', topic: 'auto' },
    ];

    let articles = [];

    for (const config of queryConfigs) {
      if (!process.env.NEWSAPI_KEY) {
          console.warn("Skipping NewsAPI fetch: NEWSAPI_KEY not set");
          continue;
      }

      // 構建 NewsAPI 請求 URL
      const url = `https://newsapi.org/v2/everything?` + 
                  `q=${encodeURIComponent(config.q)}&` +
                  `from=${since}&` +
                  `sortBy=publishedAt&` +
                  `pageSize=5&` +
                  `apiKey=${process.env.NEWSAPI_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== 'ok') {
        console.log(`查詢 "${config.q}" 出錯:`, data.message);
        continue;
      }

      if (!data.articles || data.articles.length === 0) {
        console.log(`查詢 "${config.q}" 無新聞`);
        continue;
      }

      // 提取前 5 條有效新聞
      const valid = data.articles.slice(0, 5);

      for (const a of valid) {
        // 構建防侵權重點摘要 (模擬改寫邏輯) - Adapted to match frontend 'processedSummary' structure
        const summaryPoints = [
          { label: "標題", detail: a.title },
          { label: "來源", detail: a.source.name },
          { label: "摘要", detail: a.description ? a.description.substring(0, 150) + '...' : '請閱讀原文了解更多' },
          { label: "聲明", detail: "內容由自動程序整理，詳情請點擊連結。" }
        ];

        articles.push({
          title: a.title,
          content: a.description || 'No content',
          processed_summary: summaryPoints, // Maps to JSONB in DB
          source: a.source.name,
          source_url: a.url,
          timestamp: new Date(a.publishedAt).getTime(), // Epoch for frontend sorting
          region: config.region,
          category: config.topic,
          is_robot: true,
          is_english_source: true,
          author: 'HKER Intel Bot',
          author_id: 'system-bot'
        });
      }
    }

    // 1. 去除標題重複的新聞
    const unique = articles.filter((v, i, a) => 
      a.findIndex(t => t.title === v.title) === i
    );

    // 2. 檢查有無新聞
    if (unique.length === 0) {
      console.log('36小時內無新聞，不發帖');
      return new Response(JSON.stringify({ message: 'No news found' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. 插入 Supabase (使用 upsert 避免重複標題)
    // Targeting 'posts' table to ensure frontend visibility
    const { error } = await supabase
      .from('posts')
      .upsert(unique, { onConflict: 'title' });

    if (error) {
      console.error('資料庫插入錯誤:', error);
      throw error;
    }

    console.log(`=== 機械人執行成功：插入 ${unique.length} 條新聞 ===`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: unique.length,
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('機械人運行時錯誤:', e);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
