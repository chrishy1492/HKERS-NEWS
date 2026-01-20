import { generateFromSource } from './geminiService';
import { supabase } from './supabase';
import { NEWS_API_KEY, REGIONS, TOPICS } from '../constants';

// RSS Feeds for fallback
const RSS_SOURCES = [
  'https://rthk.hk/rthk/news/rss/c/expressnews.xml', // RTHK Chinese
  'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml',  // BBC Chinese
  'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant', // Google News TW
  'http://feeds.bbci.co.uk/news/world/rss.xml' // BBC World
];

interface RawNewsItem {
  title: string;
  url: string;
  publishedAt: string;
  sourceName: string;
}

export const runNewsBotBatch = async () => {
  console.log('🤖 Bot Worker: Starting batch job...');
  
  // 1. Pick a random target to diversify news
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  
  console.log(`🤖 Bot Worker: Targeting ${region} - ${topic}`);

  try {
    // 2. Fetch Raw News (Hybrid Strategy)
    let articles: RawNewsItem[] = [];
    
    // Strategy A: NewsAPI (Primary for English/Global)
    try {
      const q = `${region} ${topic}`;
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${NEWS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.articles) {
        articles = data.articles.map((a: any) => ({
          title: a.title,
          url: a.url,
          publishedAt: a.publishedAt,
          sourceName: a.source.name
        }));
      }
    } catch (e) {
      console.warn('NewsAPI failed, trying RSS', e);
    }

    // Strategy B: RSS (Fallback/Supplement for HK/TW)
    if (articles.length === 0 || region === 'Hong Kong' || region === 'Taiwan') {
      try {
        const rssUrl = RSS_SOURCES[Math.floor(Math.random() * RSS_SOURCES.length)];
        // Use rss2json to bypass CORS
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await res.json();
        if (data.items) {
          const mapped = data.items.map((item: any) => ({
            title: item.title,
            url: item.link,
            publishedAt: item.pubDate,
            sourceName: 'RSS Feed'
          }));
          articles = [...articles, ...mapped];
        }
      } catch (e) {
        console.warn('RSS Fetch failed', e);
      }
    }

    // 3. Filter Recent (36 Hours)
    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);
    articles = articles.filter(a => new Date(a.publishedAt) > cutoff);

    if (articles.length === 0) {
      console.log('🤖 Bot Worker: No recent articles found.');
      return;
    }

    // 4. Process One Article (To avoid spamming, we process 1 per trigger, but frequent triggers)
    // Pick a random one from the fresh batch
    const target = articles[Math.floor(Math.random() * articles.length)];

    // 5. Deduplication Check
    const { data: existing } = await supabase.from('posts').select('id').eq('title_en', target.title).maybeSingle();
    if (existing) {
      console.log('🤖 Bot Worker: Duplicate found, skipping.');
      return;
    }

    // 6. AI Processing (Summarize & Translate)
    console.log(`🤖 Bot Worker: Processing with Gemini - ${target.title}`);
    const processedContent = await generateFromSource(target.title, target.url, region);

    if (processedContent) {
      // 7. Insert to DB
      const { error } = await supabase.from('posts').insert([{
        title_en: processedContent.title_en,
        title_cn: processedContent.title_cn,
        content_en: `${processedContent.content_en}\n\nSource: ${processedContent.source_url}`,
        content_cn: `${processedContent.content_cn}\n\n來源: ${processedContent.source_url}`,
        category: topic,
        region: region,
        author_name: `HKER Bot 🤖 (${target.sourceName})`,
        author_id: 'bot-admin', // Placeholder ID
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