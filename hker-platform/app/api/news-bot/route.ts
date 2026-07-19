async function fetchRssNews() {
  const results = await Promise.all(
    RSS_SOURCES.map(async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`RSS ${res.status}`)
        let xml = await res.text()
        xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
        const parsed = await parseStringPromise(xml)
        const items = parsed?.rss?.channel?.[0]?.item || []
        return items.map((item: any) => ({
          title: stripHtml(item.title?.[0] ?? ''),
          content: stripHtml(item.description?.[0] ?? item.content?.[0] ?? ''),
          url: item.link?.[0] ?? '',
          source_name: new URL(url).hostname,
          publishedAt: item.pubDate?.[0] ?? '',
        }))
      } catch (e) {
        console.error('[news-bot] RSS fetch failed for', url, (e as Error).message)
        return []
      }
    })
  )
  return results.flat()
}
