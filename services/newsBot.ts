import { generateFromSource } from './geminiService';
import { supabase } from './supabase';
import { NEWS_API_KEY, REGIONS, TOPICS } from '../constants';

// Fallback RSS
const RSS_SOURCES = [
  'https://rthk.hk/rthk/news/rss/c/expressnews.xml',
  'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml',
  'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
  'http://feeds.bbci.co.uk/news/world/rss.xml'
];

interface RawNewsItem {
  title: string;
  url: string;
  publishedAt: string;
  sourceName: string;
}

export const runNewsBotBatch = async () => {
  console.log('🤖 Bot Worker: Starting batch job...');
  
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  
  console.log(`🤖 Bot Worker: Targeting ${region} - ${topic}`);

  try {
    let articles: RawNewsItem[] = [];
    
    // Strategy A: NewsAPI (Priority)
    // Using the specific key provided in specs
    const apiKey = NEWS_API_KEY; 
    
    try {
      // "everything" endpoint with sort by publishedAt to get recent news
      const q = `"${region}" AND "${topic}"`;
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === 'ok' && data.articles && data.articles.length > 0) {
        articles = data.articles.map((a: any) => ({
          title: a.title,
          url: a.url,
          publishedAt: a.publishedAt,
          sourceName: a.source.name
        }));
      }
    } catch (e) {
      console.warn('NewsAPI Fetch failed', e);
    }

    // Strategy B: RSS (Fallback if API quota exceeded or empty)
    if (articles.length === 0) {
      try {
        const rssUrl = RSS_SOURCES[Math.floor(Math.random() * RSS_SOURCES.length)];
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await res.json();
        if (data.items) {
          articles = data.items.map((item: any) => ({
            title: item.title,
            url: item.link,
            publishedAt: item.pubDate,
            sourceName: 'RSS Feed'
          }));
        }
      } catch (e) {
        console.warn('RSS Fetch failed', e);
      }
    }

    // Filter recent (24h strict)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    articles = articles.filter(a => new Date(a.publishedAt) > cutoff);

    if (articles.length === 0) {
      console.log('🤖 Bot Worker: No recent articles found.');
      return;
    }

    // Pick one article
    const target = articles[Math.floor(Math.random() * articles.length)];

    // Check DB for duplicates
    const { data: existing } = await supabase.from('posts').select('id').eq('title_en', target.title).maybeSingle();
    if (existing) {
      console.log('🤖 Bot Worker: Duplicate found, skipping.');
      return;
    }

    console.log(`🤖 Bot Worker: Processing with Gemini - ${target.title}`);
    const processedContent = await generateFromSource(target.title, target.url, region);

    if (processedContent) {
      const { error } = await supabase.from('posts').insert([{
        title_en: processedContent.title_en,
        title_cn: processedContent.title_cn,
        content_en: `${processedContent.content_en}\n\nSource: ${processedContent.source_url}`,
        content_cn: `${processedContent.content_cn}\n\n來源: ${processedContent.source_url}`,
        category: topic,
        region: region,
        author_name: `HKER Bot 🤖 (${target.sourceName})`,
        author_id: 'bot-admin',
        is_bot: true,
        likes: 0,
        loves: 0
      }]);

      if (error) console.error('DB Insert Error:', error);
      else console.log('🤖 Bot Worker: Posted successfully!');
    }

  } catch (error) {
    console.error('🤖 Bot Worker Critical Error:', error);
  }
};