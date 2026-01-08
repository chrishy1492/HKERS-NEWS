import { createClient } from '@supabase/supabase-js';

// 強制不緩存，確保每次 cron 執行都是最新的
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
  const newsApiKey = process.env.NEWS_API_KEY || process.env.API_KEY;

  // 1. 檢查環境變數
  if (!supabaseUrl || !supabaseServiceKey || !newsApiKey) {
    return new Response(JSON.stringify({ error: 'Missing Environment Variables' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const configs = [
    { q: 'Hong Kong economy', reg: 'Hong Kong', cat: 'Finance' },
    { q: 'Hong Kong real estate', reg: 'Hong Kong', cat: 'Real Estate' },
    { q: 'Hong Kong policy', reg: 'Hong Kong', cat: 'Current Affairs' },
    { q: 'UK immigration BNO', reg: 'UK', cat: 'Current Affairs' },
    { q: 'Taiwan semiconductor', reg: 'Taiwan', cat: 'Digital' },
    { q: 'Solana crypto', reg: 'Global', cat: 'Finance' },
    { q: 'Artificial Intelligence', reg: 'USA', cat: 'Digital' }
  ];

  let results: any[] = [];

  for (const conf of configs) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(conf.q)}&from=${since}&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`;
    
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      
      if (data.status === 'ok' && Array.isArray(data.articles)) {
        data.articles.slice(0, 5).forEach((a: any) => {
          if (!a.title || a.title === '[Removed]') return;

          results.push({
            title: a.title,
            content: a.description || a.content || 'Content not available.',
            source: a.source.name || 'NewsAPI',
            source_url: a.url,
            region: conf.reg,
            category: conf.cat,
            is_robot: true,
            author: 'HKER Bot',
            author_id: 'system-bot',
            // 注意：請確認資料庫中 timestamp 是數字類型還是日期類型
            timestamp: new Date(a.publishedAt).toISOString(), 
            views: Math.floor(Math.random() * 50)
          });
        });
      }
    } catch (e) { 
      console.error(`Fetch error for ${conf.q}:`, e); 
    }
  }

  if (results.length === 0) {
    return new Response(JSON.stringify({ message: "No new articles found" }), { status: 200 });
  }

  const uniqueResults = results.filter((v, i, a) => a.findIndex(t => t.title === v.title) === i);

  // 2. 執行寫入 Supabase
  const { error } = await supabase
    .from('posts')
    .upsert(uniqueResults, { onConflict: 'title', ignoreDuplicates: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    count: uniqueResults.length 
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}