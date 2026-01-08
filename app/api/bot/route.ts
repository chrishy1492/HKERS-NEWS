import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const newsApiKey = process.env.NEWS_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !newsApiKey) {
    return new Response(JSON.stringify({ error: 'Missing Environment Variables' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 結合你的配置
  const configs = [
    { q: 'Hong Kong economy', reg: 'hk', cat: 'Finance' },
    { q: 'UK inflation', reg: 'uk', cat: 'News' },
    { q: 'Taiwan semiconductor', reg: 'tw', cat: 'Digital' }
  ];

  let results = [];

  for (const conf of configs) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(conf.q)}&from=${since}&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`;
    
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      
      if (data.articles) {
        data.articles.slice(0, 3).forEach((a: any) => {
          if (!a.title || a.title === '[Removed]') return;
          results.push({
            title: a.title,
            content: a.description || 'Content not available.',
            source: a.source.name || 'NewsAPI',
            source_url: a.url,
            region: conf.reg,
            category: conf.cat,
            is_robot: true,
            author: 'HKER Intel Bot',
            author_id: 'system-bot',
            timestamp: new Date(a.publishedAt).toISOString(),
            views: Math.floor(Math.random() * 50)
          });
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 寫入 Supabase
  const { error } = await supabase.from('posts').upsert(results, { onConflict: 'title', ignoreDuplicates: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true, count: results.length }), { status: 200 });
}