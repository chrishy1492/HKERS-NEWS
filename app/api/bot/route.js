// /api/news-bot/route.js (或類似路徑)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 信任來源白名單
const TRUSTED_DOMAINS = ['reuters.com', 'apnews.com', 'bloomberg.com', 'scmp.com', 'rthk.hk', 'cna.com.tw'];

export async function GET() {
  const regions = [
    { code: 'hk', query: '香港 經濟 樓市', lang: 'zh-HK' },
    { code: 'uk', query: 'UK inflation NHS London', lang: 'en' },
    { code: 'tw', query: '台灣 健保 台積電', lang: 'zh-TW' }
  ];

  try {
    for (const config of regions) {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(config.query)}&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`
      );
      const data = await response.json();

      if (!data.articles) continue;

      const processedPosts = data.articles
        .filter(art => TRUSTED_DOMAINS.some(domain => art.url.includes(domain))) // 來源過濾
        .slice(0, 3) // 每個地區取前 3 條，避免洗版
        .map(art => ({
          title: art.title,
          titleCN: formatLocalTitle(art.title, config.code), // 本地化標題
          content: art.description,
          contentCN: art.description, // 這裡可接入 OpenAI 進行精簡翻譯
          region: config.code,
          category: 'news',
          author: 'HKER Intel Bot',
          source: art.source.name,
          source_url: art.url,
          is_robot: true,
          timestamp: new Date(art.publishedAt).getTime()
        }));

      // Upsert 到 Supabase (以標題為唯一值避免重複)
      await supabase.from('posts').upsert(processedPosts, { onConflict: 'title' });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 輔助函式：本地化關鍵字加強 (增強真實感)
function formatLocalTitle(title, region) {
  if (region === 'hk') return `【即時】${title.replace('Hong Kong', '本港')}`;
  if (region === 'uk') return `🇬🇧 英國速遞：${title}`;
  if (region === 'tw') return `【台視新聞】${title}`;
  return title;
}