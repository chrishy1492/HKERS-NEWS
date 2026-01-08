
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: This runs on the server (Vercel Cron).
// Ensure 'SUPABASE_SERVICE_ROLE_KEY' is set in Vercel Environment Variables.
// Do NOT expose the Service Role Key in client-side files.

export default async function handler(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
  const newsApiKey = process.env.NEWS_API_KEY || process.env.API_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !newsApiKey) {
    return new Response(JSON.stringify({ error: 'Missing Environment Variables' }), { status: 500 });
  }

  // Use Service Role Key to bypass RLS for administrative writes
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Calculate 'since' (24 hours ago)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Query Configurations
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
        // Take top 5 recent articles per topic to avoid spamming
        data.articles.slice(0, 5).forEach((a: any) => {
          if (!a.title || a.title === '[Removed]') return;

          results.push({
            title: a.title,
            content: a.description || a.content || 'Content not available.',
            source: a.source.name || 'NewsAPI',
            source_url: a.url,
            region: conf.reg,
            category: conf.cat,
            is_robot: true, // DB column uses snake_case
            author: 'HKER Bot',
            author_id: 'system-bot',
            timestamp: new Date(a.publishedAt).getTime(),
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

  // Dedup in memory based on title before hitting DB
  const uniqueResults = results.filter((v, i, a) => a.findIndex(t => t.title === v.title) === i);

  // Executing Upsert
  // 'onConflict' MUST match the unique constraint in Supabase (unique_post_title)
  const { error } = await supabase
    .from('posts')
    .upsert(uniqueResults, { onConflict: 'title', ignoreDuplicates: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    count: uniqueResults.length 
  }), { status: 200 });
}
