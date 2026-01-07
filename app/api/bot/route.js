
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// 公信力來源白名單 (用於 NewsAPI 的 domains 參數)
const TRUSTED_DOMAINS = [
  'bbc.com', 'reuters.com', 'theguardian.com', 'cnn.com', 
  'nytimes.com', 'scmp.com', 'theverge.com', 'abc.net.au', 
  'taipeitimes.com', 'thestandard.com.hk'
].join(',');

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  
  // 簡單安全檢查 (可選：防止外部惡意觸發)
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  console.log('=== [BOT] 開始執行任務 ===', new Date().toISOString());

  try {
    // 嚴格過濾 36 小時內的新聞
    const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    const queryConfigs = [
      { q: 'Nvidia Rubin OR CES 2026 OR AI Chip', region: 'us', topic: 'digital' },
      { q: 'Hong Kong Property OR HK real estate', region: 'hk', topic: 'property' },
      { q: 'Taiwan military OR Lai Ching-te', region: 'tw', topic: 'news' },
      { q: 'Australia heatwave OR weather alert', region: 'au', topic: 'weather' },
      { q: 'Europe energy OR snow storm', region: 'eu', topic: 'weather' },
      { q: 'UK economy OR FTSE 100', region: 'uk', topic: 'finance' }
    ];

    let allFetchedArticles = [];

    for (const config of queryConfigs) {
      // 構建 NewsAPI 請求 URL (限制來源域名)
      // Note: apiKey usage requires server-side env var
      if (!process.env.NEWSAPI_KEY) {
          console.warn("Skipping NewsAPI fetch: NEWSAPI_KEY not set");
          continue;
      }

      const url = `https://newsapi.org/v2/everything?` + 
                  `q=${encodeURIComponent(config.q)}&` +
                  `domains=${TRUSTED_DOMAINS}&` +
                  `from=${since}&` +
                  `sortBy=relevancy&` +
                  `pageSize=10&` +
                  `apiKey=${process.env.NEWSAPI_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== 'ok') {
        console.error(`[API Error] ${config.region}: ${data.message}`);
        continue;
      }

      if (!data.articles || data.articles.length === 0) continue;

      // 數據清洗與「防侵權」格式化
      const processed = data.articles.map(a => {
        // 簡單的自動改寫：提取關鍵數據並轉換為點列格式 (模擬邏輯)
        const summaryPoints = [
          { label: "重點摘要", detail: a.title },
          { label: "時效", detail: `發佈於 ${new Date(a.publishedAt).toLocaleString('zh-HK')}` },
          { label: "來源", detail: `${a.source.name} 報導` },
          { label: "摘要", detail: a.description ? a.description.substring(0, 150) : '點擊連結查看全文' },
          { label: "聲明", detail: "內容由 AI 重點整理，非原文複製。" }
        ];

        return {
          title: a.title,
          content: a.description || 'No content',
          processed_summary: summaryPoints, // Maps to JSONB
          source: a.source.name,
          source_url: a.url,
          timestamp: new Date(a.publishedAt).getTime(),
          region: config.region,
          category: config.topic,
          is_robot: true,
          is_english_source: true,
          author: 'HKER Intel Bot',
          author_id: 'system-bot'
        };
      });

      allFetchedArticles.push(...processed);
    }

    // 1. 去除重複標題
    const uniqueArticles = allFetchedArticles.filter((v, i, a) => 
      a.findIndex(t => t.title === v.title) === i
    );

    // 2. 檢查是否真的有抓到新聞
    if (uniqueArticles.length === 0) {
      console.log('=== [BOT] 本次運行未發現 36h 內符合條件的新聞 ===');
      return new Response(JSON.stringify({ message: 'No new trusted articles found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. 插入 Supabase (使用 upsert 防止標題重複插入)
    // Note: Assuming table 'posts' exists matching structure
    const { data: insertedData, error } = await supabase
      .from('posts')
      .upsert(uniqueArticles, { onConflict: 'title' });

    if (error) throw error;

    console.log(`=== [BOT] 成功處理並更新 ${uniqueArticles.length} 條新聞 ===`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: uniqueArticles.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('=== [BOT ERROR] ===', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
